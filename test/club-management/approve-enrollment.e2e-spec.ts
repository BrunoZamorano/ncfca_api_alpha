import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { EnrollmentStatus, MembershipStatus } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { FamilyStatus } from '@/domain/enums/family-status';

import {
  setupClubManagementApp,
  createClubOwnerUser,
  createRegularUser,
  createTestClub,
  createTestFamily,
  createTestDependant,
  createTestEnrollmentRequest,
  createTestClubMembership,
  clubManagementCleanup,
  ClubManagementTestUser,
  ClubTestData,
} from './setup';

describe('(E2E) ApproveEnrollment', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let clubOwner: ClubManagementTestUser;
  let clubOwnerWithFullClub: ClubManagementTestUser;
  let otherClubOwner: ClubManagementTestUser;
  let unauthorizedUser: ClubManagementTestUser;
  let testFamily: ClubManagementTestUser;
  let notAffiliatedFamily: ClubManagementTestUser;
  let testClub: ClubTestData;
  let fullCapacityClub: ClubTestData;

  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupClubManagementApp());

    // Criar usuário dono do clube principal
    clubOwner = await createClubOwnerUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(clubOwner.userId);

    // Criar usuário dono de clube com capacidade limitada
    clubOwnerWithFullClub = await createClubOwnerUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(clubOwnerWithFullClub.userId);

    // Criar outro usuário dono de clube
    otherClubOwner = await createClubOwnerUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(otherClubOwner.userId);

    // Criar usuário sem permissão
    unauthorizedUser = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(unauthorizedUser.userId);

    // Criar família afiliada para testes
    testFamily = await createTestFamily(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(testFamily.userId);

    // Criar família não afiliada
    notAffiliatedFamily = await createTestFamily(app, prisma, FamilyStatus.NOT_AFFILIATED);
    testUsers.push(notAffiliatedFamily.userId);

    // Criar clube para o dono principal
    testClub = await createTestClub(prisma, clubOwner.userId, {
      name: 'Clube Aprovação E2E',
      maxMembers: 30,
    });

    // Criar clube com capacidade máxima 1 para teste de lotação
    fullCapacityClub = await createTestClub(prisma, clubOwnerWithFullClub.userId, {
      name: 'Clube Lotado E2E',
      maxMembers: 1,
    });

    // Criar outro clube para outro dono
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await clubManagementCleanup(prisma, testUsers);
    await app.close();
  });

  describe('POST /club-management/enrollments/:enrollmentId/approve', () => {
    it('Deve aprovar uma matrícula pendente e válida', async () => {
      // Arrange - Criar dependente e enrollment request pendente
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'Silva',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.PENDING);

      // Act - Aprovar a matrícula
      const response: request.Response = await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/approve`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Assert - Verificar resposta vazia
      expect(response.body).toEqual({});

      // Assert - Verificar que o status do enrollment foi atualizado
      const updatedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(updatedEnrollment?.status).toBe(EnrollmentStatus.APPROVED);
      expect(updatedEnrollment?.resolved_at).toBeTruthy();

      // Assert - Verificar que foi criada uma ClubMembership ativa
      const membership = await prisma.clubMembership.findFirst({
        where: {
          club_id: testClub.id,
          member_id: dependant.id,
          family_id: testFamily.familyId,
        },
      });
      expect(membership).toBeTruthy();
      expect(membership?.status).toBe(MembershipStatus.ACTIVE);
    });

    it('Não deve aprovar matrícula quando o clube está lotado', async () => {
      // Arrange - Criar dependente e lotar o clube primeiro
      const dependant1 = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'Primeiro',
        lastName: 'Membro',
      });

      const dependant2 = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'Segundo',
        lastName: 'Membro',
      });

      // Criar membership que lota o clube (maxMembers = 1)
      await createTestClubMembership(prisma, fullCapacityClub.id, dependant1.id, testFamily.familyId, MembershipStatus.ACTIVE);

      // Criar enrollment request para o segundo membro
      const enrollmentRequest = await createTestEnrollmentRequest(
        prisma,
        fullCapacityClub.id,
        dependant2.id,
        testFamily.familyId,
        EnrollmentStatus.PENDING,
      );

      // Act & Assert - Tentar aprovar deve falhar
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/approve`)
        .set('Authorization', `Bearer ${clubOwnerWithFullClub.accessToken}`)
        .expect(HttpStatus.BAD_REQUEST);

      // Assert - Verificar que o status do enrollment permaneceu PENDING
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.PENDING);
      expect(unchangedEnrollment?.resolved_at).toBeNull();

      // Assert - Verificar que não foi criada ClubMembership
      const membership = await prisma.clubMembership.findFirst({
        where: {
          club_id: fullCapacityClub.id,
          member_id: dependant2.id,
          family_id: testFamily.familyId,
        },
      });
      expect(membership).toBeNull();
    });

    it('Não deve aprovar matrícula quando a família não está afiliada', async () => {
      // Arrange - Criar dependente da família não afiliada
      const dependant = await createTestDependant(prisma, notAffiliatedFamily.familyId, {
        firstName: 'João',
        lastName: 'NãoAfiliado',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(
        prisma,
        testClub.id,
        dependant.id,
        notAffiliatedFamily.familyId,
        EnrollmentStatus.PENDING,
      );

      // Act & Assert - Tentar aprovar deve falhar
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/approve`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.BAD_REQUEST);

      // Assert - Verificar que o status do enrollment permaneceu PENDING
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.PENDING);
      expect(unchangedEnrollment?.resolved_at).toBeNull();

      // Assert - Verificar que não foi criada ClubMembership
      const membership = await prisma.clubMembership.findFirst({
        where: {
          club_id: testClub.id,
          member_id: dependant.id,
          family_id: notAffiliatedFamily.familyId,
        },
      });
      expect(membership).toBeNull();
    });

    it('Não deve aprovar matrícula já aprovada', async () => {
      // Arrange - Criar dependente e enrollment request já aprovado
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'JáAprovado',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.APPROVED);

      // Act & Assert - Tentar aprovar deve falhar
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/approve`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.BAD_REQUEST);

      // Assert - Verificar que o status permaneceu APPROVED
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.APPROVED);
    });

    it('Não deve aprovar matrícula já rejeitada', async () => {
      // Arrange - Criar dependente e enrollment request já rejeitado
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'JáRejeitado',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.REJECTED);

      // Act & Assert - Tentar aprovar deve falhar
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/approve`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.BAD_REQUEST);

      // Assert - Verificar que o status permaneceu REJECTED
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.REJECTED);
    });

    it('Não deve permitir aprovação por usuário não autorizado', async () => {
      // Arrange - Criar dependente e enrollment request
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'SemPermissão',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.PENDING);

      // Act & Assert - Tentar aprovar com usuário sem permissão
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/approve`)
        .set('Authorization', `Bearer ${unauthorizedUser.accessToken}`)
        .expect(HttpStatus.FORBIDDEN);

      // Assert - Verificar que o status permaneceu PENDING
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.PENDING);
      expect(unchangedEnrollment?.resolved_at).toBeNull();
    });

    it('Não deve permitir aprovação por dono de outro clube', async () => {
      // Arrange - Criar dependente e enrollment request
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'OutroClube',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.PENDING);

      // Act & Assert - Tentar aprovar com dono de outro clube
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/approve`)
        .set('Authorization', `Bearer ${otherClubOwner.accessToken}`)
        .expect(HttpStatus.FORBIDDEN);

      // Assert - Verificar que o status permaneceu PENDING
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.PENDING);
      expect(unchangedEnrollment?.resolved_at).toBeNull();
    });

    it('Não deve aprovar matrícula com ID inexistente', async () => {
      // Arrange - ID de enrollment inexistente
      const nonExistentId = crypto.randomUUID();

      // Act & Assert - Tentar aprovar deve retornar 404
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${nonExistentId}/approve`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('Não deve permitir acesso sem token de autenticação', async () => {
      // Arrange - Criar enrollment request qualquer
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'SemToken',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.PENDING);

      // Act & Assert - Tentar aprovar sem token
      await request(app.getHttpServer()).post(`/club-management/enrollments/${enrollmentRequest.id}/approve`).expect(HttpStatus.UNAUTHORIZED);

      // Assert - Verificar que o status permaneceu PENDING
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.PENDING);
      expect(unchangedEnrollment?.resolved_at).toBeNull();
    });
  });
});
