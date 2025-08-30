import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { EnrollmentStatus } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';

import {
  setupClubManagementApp,
  createClubOwnerUser,
  createRegularUser,
  createTestClub,
  createTestDependant,
  createTestEnrollmentRequest,
  clubManagementCleanup,
  ClubManagementTestUser,
  ClubTestData,
} from './setup';

/**
 * ESTE É UM ARQUIVO TEMPLATE/EXEMPLO
 * Demonstra como usar a infraestrutura de testes para ClubManagement
 *
 * Para implementar testes reais:
 * 1. Copie este arquivo renomeando para a funcionalidade específica
 * 2. Adapte os testes para o cenário que você quer testar
 * 3. Remova este comentário
 */
describe('(E2E) ExemploTemplate - ClubManagement', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let clubOwner: ClubManagementTestUser;
  let regularUser: ClubManagementTestUser;
  let secondClubOwner: ClubManagementTestUser;
  let testClub: ClubTestData;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupClubManagementApp());

    // Criar usuário dono do clube
    clubOwner = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwner.userId);

    // Criar segundo usuário dono para teste que precisa de clube separado
    secondClubOwner = await createClubOwnerUser(app, prisma);
    testUsers.push(secondClubOwner.userId);

    // Criar usuário regular
    regularUser = await createRegularUser(app, prisma);
    testUsers.push(regularUser.userId);

    // Criar clube para o dono principal
    testClub = await createTestClub(prisma, clubOwner.userId, {
      name: 'Clube Template E2E',
      maxMembers: 50,
    });
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await clubManagementCleanup(prisma, testUsers);
    await app.close();
  });

  describe('Obtendo informações do clube', () => {
    it('Deve retornar informações do clube para o dono autenticado', async () => {
      // Arrange - Dados já preparados no beforeAll

      // Act - Buscar informações do clube
      const response = await request(app.getHttpServer())
        .get('/club-management/my-club')
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Validar dados retornados
      expect(response.body).toMatchObject({
        id: testClub.id,
        name: testClub.name,
        principalId: clubOwner.userId,
      });
    });

    it('Não deve permitir acesso sem autenticação', async () => {
      // Arrange - Nenhuma preparação especial

      // Act & Assert - Tentar acessar sem token
      await request(app.getHttpServer()).get('/club-management/my-club').expect(HttpStatus.UNAUTHORIZED);
    });

    it('Não deve permitir acesso para usuário que não é dono de clube', async () => {
      // Arrange - Usuário regular já criado

      // Act & Assert - Tentar acessar com usuário regular
      await request(app.getHttpServer())
        .get('/club-management/my-club')
        .set('Authorization', `Bearer ${regularUser.accessToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('Gestão de enrollments', () => {
    it('Deve listar enrollments pendentes para o clube', async () => {
      // Arrange - Criar dependente e enrollment request
      const dependant = await createTestDependant(prisma, regularUser.familyId, {
        firstName: 'Maria',
        lastName: 'Santos',
      });

      await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, regularUser.familyId, EnrollmentStatus.PENDING);

      // Act - Listar enrollments pendentes
      const response = await request(app.getHttpServer())
        .get(`/club-management/${testClub.id}/enrollments/pending`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Validar que o enrollment está na lista
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        dependantId: dependant.id,
        dependantName: 'Maria Santos',
        status: 'PENDING',
      });
    });

    it('Deve retornar lista vazia quando não há enrollments pendentes', async () => {
      // Arrange - Usar o segundo clube owner (cada usuário só pode ter um clube)
      const newClub = await createTestClub(prisma, secondClubOwner.userId, {
        name: 'Clube Sem Enrollments',
      });

      // Act - Buscar enrollments pendentes
      const response = await request(app.getHttpServer())
        .get(`/club-management/${newClub.id}/enrollments/pending`)
        .set('Authorization', `Bearer ${secondClubOwner.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Lista deve estar vazia
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('Exemplo de teste mais complexo com múltiplas entidades', () => {
    it('Deve demonstrar fluxo completo de enrollment', async () => {
      // Arrange - Preparar cenário complexo
      const dependant = await createTestDependant(prisma, regularUser.familyId, {
        firstName: 'João',
        lastName: 'Silva',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, regularUser.familyId, EnrollmentStatus.PENDING);

      // Act - Aprovar o enrollment
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/approve`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Assert - Verificar que o enrollment foi aprovado no banco
      const updatedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });

      expect(updatedEnrollment?.status).toBe(EnrollmentStatus.APPROVED);

      // Assert - Verificar que membership foi criada
      const membership = await prisma.clubMembership.findFirst({
        where: {
          club_id: testClub.id,
          member_id: dependant.id,
        },
      });

      expect(membership).toBeDefined();
      expect(membership?.status).toBe('ACTIVE');
    });
  });
});
