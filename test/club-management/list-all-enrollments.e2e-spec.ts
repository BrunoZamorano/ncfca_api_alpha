import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { EnrollmentStatus } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { EnrollmentRequestDto } from '@/domain/dtos/enrollment-request.dto';

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

describe('(E2E) ListAllEnrollments', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let clubOwner: ClubManagementTestUser;
  let clubOwnerWithoutClub: ClubManagementTestUser;
  let testFamily: ClubManagementTestUser;
  let testClub: ClubTestData;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupClubManagementApp());

    // Criar usuário dono do clube
    clubOwner = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwner.userId);

    // Criar segundo usuário dono sem clube
    clubOwnerWithoutClub = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwnerWithoutClub.userId);

    // Criar família afiliada para testes
    testFamily = await createTestFamily(app, prisma);
    testUsers.push(testFamily.userId);

    // Criar clube para o dono principal
    testClub = await createTestClub(prisma, clubOwner.userId, {
      name: 'Clube Matrículas E2E',
      maxMembers: 30,
    });

    // Criar dependente para a família
    const dependant = await createTestDependant(prisma, testFamily.familyId, {
      firstName: 'João',
      lastName: 'Silva',
    });

    // Criar solicitações de matrícula com diferentes status
    await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.PENDING);

    await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.APPROVED);

    await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.REJECTED);
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await clubManagementCleanup(prisma, testUsers);
    await app.close();
  });

  describe('GET /club-management/my-club/enrollments', () => {
    it('Deve listar todas as matrículas do meu clube', async () => {
      // Arrange - Dados já preparados no beforeAll

      // Act - Buscar todas as matrículas
      const response: { body: EnrollmentRequestDto[] } = await request(app.getHttpServer())
        .get('/club-management/my-club/enrollments')
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Validar que retorna array com todos os status
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);

      // Verificar que cada enrollment tem os campos obrigatórios
      response.body.forEach((enrollment: EnrollmentRequestDto) => {
        expect(enrollment).toHaveProperty('id');
        expect(enrollment).toHaveProperty('status');
        expect(enrollment).toHaveProperty('clubId', testClub.id);
        expect(enrollment).toHaveProperty('familyId', testFamily.familyId);
        expect(enrollment).toHaveProperty('dependantId');
        expect(enrollment).toHaveProperty('requestedAt');
        expect(enrollment).toHaveProperty('resolvedAt');
        expect(enrollment).toHaveProperty('rejectionReason');
      });

      // Verificar que todos os status estão presentes
      const statuses = response.body.map((enrollment: EnrollmentRequestDto) => enrollment.status);
      expect(statuses).toContain(EnrollmentStatus.PENDING);
      expect(statuses).toContain(EnrollmentStatus.APPROVED);
      expect(statuses).toContain(EnrollmentStatus.REJECTED);
    });

    it('Deve retornar lista vazia quando não houver matrículas', async () => {
      // Arrange - Criar novo clube sem matrículas
      const newClubOwner = await createClubOwnerUser(app, prisma);
      testUsers.push(newClubOwner.userId);

      await createTestClub(prisma, newClubOwner.userId, {
        name: 'Clube Vazio',
      });

      // Act - Buscar matrículas do clube vazio
      const response: { body: EnrollmentRequestDto[] } = await request(app.getHttpServer())
        .get('/club-management/my-club/enrollments')
        .set('Authorization', `Bearer ${newClubOwner.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Deve retornar array vazio
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('Não deve retornar matrículas quando usuário dono não possui clube', async () => {
      // Arrange - Usuário sem clube já criado

      // Act & Assert - Tentar buscar matrículas sem ter clube
      await request(app.getHttpServer())
        .get('/club-management/my-club/enrollments')
        .set('Authorization', `Bearer ${clubOwnerWithoutClub.accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('Não deve permitir acesso sem token de autenticação', async () => {
      // Arrange - Nenhuma preparação especial

      // Act & Assert - Tentar acessar sem token
      await request(app.getHttpServer()).get('/club-management/my-club/enrollments').expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
