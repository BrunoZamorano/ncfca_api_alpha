import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { EnrollmentStatus } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { ListPendingEnrollmentsOutputDto } from '@/infraestructure/dtos/list-pending-enrollments.dto';

import {
  setupClubManagementApp,
  createClubOwnerUser,
  createTestClub,
  createTestFamily,
  createTestDependant,
  createTestEnrollmentRequest,
  clubManagementCleanup,
  ClubManagementTestUser,
  ClubTestData,
} from './setup';

describe('(E2E) ListPendingEnrollments', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let clubOwner: ClubManagementTestUser;
  let otherClubOwner: ClubManagementTestUser;
  let testFamily: ClubManagementTestUser;
  let testClub: ClubTestData;
  let otherTestClub: ClubTestData;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupClubManagementApp());

    // Criar usuário dono do clube principal
    clubOwner = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwner.userId);

    // Criar outro usuário dono de clube
    otherClubOwner = await createClubOwnerUser(app, prisma);
    testUsers.push(otherClubOwner.userId);

    // Criar família afiliada para testes
    testFamily = await createTestFamily(app, prisma);
    testUsers.push(testFamily.userId);

    // Criar clube para o dono principal
    testClub = await createTestClub(prisma, clubOwner.userId, {
      name: 'Clube Pendentes E2E',
      maxMembers: 30,
    });

    // Criar outro clube para outro dono
    otherTestClub = await createTestClub(prisma, otherClubOwner.userId, {
      name: 'Outro Clube E2E',
      maxMembers: 25,
    });

    // Criar dependente para a família
    const dependant1 = await createTestDependant(prisma, testFamily.familyId, {
      firstName: 'João',
      lastName: 'Silva',
    });

    const dependant2 = await createTestDependant(prisma, testFamily.familyId, {
      firstName: 'Maria',
      lastName: 'Santos',
    });

    // Criar solicitações pendentes para o clube principal
    await createTestEnrollmentRequest(prisma, testClub.id, dependant1.id, testFamily.familyId, EnrollmentStatus.PENDING);

    await createTestEnrollmentRequest(prisma, testClub.id, dependant2.id, testFamily.familyId, EnrollmentStatus.PENDING);

    // Criar solicitações com outros status (não devem aparecer)
    await createTestEnrollmentRequest(prisma, testClub.id, dependant1.id, testFamily.familyId, EnrollmentStatus.APPROVED);

    await createTestEnrollmentRequest(prisma, testClub.id, dependant2.id, testFamily.familyId, EnrollmentStatus.REJECTED);

    // Criar solicitação pendente para o outro clube
    await createTestEnrollmentRequest(prisma, otherTestClub.id, dependant1.id, testFamily.familyId, EnrollmentStatus.PENDING);
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await clubManagementCleanup(prisma, testUsers);
    await app.close();
  });

  describe('GET /club-management/:clubId/enrollments/pending', () => {
    it('Deve listar apenas matrículas pendentes com dependantName populado', async () => {
      // Arrange - Dados já preparados no beforeAll

      // Act - Buscar matrículas pendentes
      const response: { body: ListPendingEnrollmentsOutputDto[] } = await request(app.getHttpServer())
        .get(`/club-management/${testClub.id}/enrollments/pending`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Validar que retorna apenas pendentes
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);

      // Verificar que todos os enrollments são PENDING
      response.body.forEach((enrollment: ListPendingEnrollmentsOutputDto) => {
        expect(enrollment.status).toBe(EnrollmentStatus.PENDING);
      });

      // Verificar que cada enrollment tem os campos obrigatórios incluindo dependantName
      response.body.forEach((enrollment: ListPendingEnrollmentsOutputDto) => {
        expect(enrollment).toHaveProperty('id');
        expect(enrollment).toHaveProperty('status', EnrollmentStatus.PENDING);
        expect(enrollment).toHaveProperty('clubId', testClub.id);
        expect(enrollment).toHaveProperty('familyId', testFamily.familyId);
        expect(enrollment).toHaveProperty('dependantId');
        expect(enrollment).toHaveProperty('dependantName');
        expect(enrollment).toHaveProperty('requestedAt');
        expect(enrollment).toHaveProperty('resolvedAt');
        expect(enrollment).toHaveProperty('rejectionReason');

        // Verificar que dependantName está presente e não é vazio
        expect(typeof enrollment.dependantName).toBe('string');
        expect(enrollment.dependantName.length).toBeGreaterThan(0);
      });

      // Verificar que os nomes dos dependentes estão corretos
      const dependantNames = response.body.map((enrollment: ListPendingEnrollmentsOutputDto) => enrollment.dependantName);
      expect(dependantNames).toContain('João Silva');
      expect(dependantNames).toContain('Maria Santos');
    });

    it('Deve retornar lista vazia quando não houver matrículas pendentes', async () => {
      // Arrange - Criar novo clube sem matrículas pendentes
      const newClubOwner = await createClubOwnerUser(app, prisma);
      testUsers.push(newClubOwner.userId);

      const newClub = await createTestClub(prisma, newClubOwner.userId, {
        name: 'Clube Sem Pendentes',
      });

      // Act - Buscar pendentes do clube vazio
      const response: { body: ListPendingEnrollmentsOutputDto[] } = await request(app.getHttpServer())
        .get(`/club-management/${newClub.id}/enrollments/pending`)
        .set('Authorization', `Bearer ${newClubOwner.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Deve retornar array vazio
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('Não deve listar pendentes de clube que não possuo', async () => {
      // Arrange - Tentar acessar clube de outro usuário

      // Act & Assert - Deve retornar 403 FORBIDDEN
      await request(app.getHttpServer())
        .get(`/club-management/${otherTestClub.id}/enrollments/pending`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('Não deve permitir acesso sem token de autenticação', async () => {
      // Arrange - Nenhuma preparação especial

      // Act & Assert - Tentar acessar sem token
      await request(app.getHttpServer()).get(`/club-management/${testClub.id}/enrollments/pending`).expect(HttpStatus.UNAUTHORIZED);
    });

    it('Deve retornar erro 404 para clube inexistente', async () => {
      // Arrange - ID de clube inexistente
      const nonExistentClubId = crypto.randomUUID();

      // Act & Assert - Deve retornar 404 NOT FOUND
      await request(app.getHttpServer())
        .get(`/club-management/${nonExistentClubId}/enrollments/pending`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
