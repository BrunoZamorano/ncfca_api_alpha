import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { EnrollmentStatus } from '@prisma/client';

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
  clubManagementCleanup,
  ClubManagementTestUser,
  ClubTestData,
} from './setup';

describe('(E2E) RejectEnrollment', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let clubOwner: ClubManagementTestUser;
  let otherClubOwner: ClubManagementTestUser;
  let unauthorizedUser: ClubManagementTestUser;
  let testFamily: ClubManagementTestUser;
  let testClub: ClubTestData;
  let otherTestClub: ClubTestData;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupClubManagementApp());

    // Criar usuário dono do clube principal
    clubOwner = await createClubOwnerUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(clubOwner.userId);

    // Criar outro usuário dono de clube
    otherClubOwner = await createClubOwnerUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(otherClubOwner.userId);

    // Criar usuário sem permissão
    unauthorizedUser = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(unauthorizedUser.userId);

    // Criar família afiliada para testes
    testFamily = await createTestFamily(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(testFamily.userId);

    // Criar clube para o dono principal
    testClub = await createTestClub(prisma, clubOwner.userId, {
      name: 'Clube Rejeição E2E',
      maxMembers: 30,
    });

    // Criar outro clube para outro dono
    otherTestClub = await createTestClub(prisma, otherClubOwner.userId, {
      name: 'Outro Clube E2E',
      maxMembers: 25,
    });
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await clubManagementCleanup(prisma, testUsers);
    await app.close();
  });

  describe('POST /club-management/enrollments/:enrollmentId/reject', () => {
    it('Deve rejeitar matrícula registrando o motivo', async () => {
      // Arrange - Criar dependente e enrollment request pendente
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'Silva',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.PENDING);

      const rejectionReason = 'Infelizmente, todas as vagas para esta faixa etária já foram preenchidas.';

      // Act - Rejeitar a matrícula
      const response = await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/reject`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .send({ reason: rejectionReason })
        .expect(HttpStatus.NO_CONTENT);

      // Assert - Verificar resposta vazia
      expect(response.body).toEqual({});

      // Assert - Verificar que o status do enrollment foi atualizado
      const updatedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(updatedEnrollment?.status).toBe(EnrollmentStatus.REJECTED);
      expect(updatedEnrollment?.resolved_at).toBeTruthy();
      expect(updatedEnrollment?.rejection_reason).toBe(rejectionReason);

      // Assert - Verificar que não foi criada ClubMembership
      const membership = await prisma.clubMembership.findFirst({
        where: {
          club_id: testClub.id,
          member_id: dependant.id,
          family_id: testFamily.familyId,
        },
      });
      expect(membership).toBeNull();
    });

    it('Não deve rejeitar matrícula já aprovada', async () => {
      // Arrange - Criar dependente e enrollment request já aprovado
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'JáAprovado',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.APPROVED);

      const rejectionReason = 'Mudança de critérios após aprovação inicial.';

      // Act & Assert - Tentar rejeitar matrícula já aprovada deve falhar
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/reject`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .send({ reason: rejectionReason })
        .expect(HttpStatus.BAD_REQUEST);

      // Assert - Verificar que o status permaneceu APPROVED
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.APPROVED);
    });

    it('Não deve rejeitar matrícula já rejeitada', async () => {
      // Arrange - Criar dependente e enrollment request já rejeitado
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'JáRejeitado',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.REJECTED);

      // Definir motivo antigo manualmente
      await prisma.enrollmentRequest.update({
        where: { id: enrollmentRequest.id },
        data: { rejection_reason: 'Motivo antigo' },
      });

      const newRejectionReason = 'Novo motivo de rejeição mais detalhado.';

      // Act & Assert - Tentar rejeitar novamente deve falhar
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/reject`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .send({ reason: newRejectionReason })
        .expect(HttpStatus.BAD_REQUEST);

      // Assert - Verificar que o motivo não foi atualizado
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.REJECTED);
      expect(unchangedEnrollment?.rejection_reason).toBe('Motivo antigo');
    });

    it('Não deve permitir rejeição por usuário não autorizado', async () => {
      // Arrange - Criar dependente e enrollment request
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'SemPermissão',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.PENDING);

      const rejectionReason = 'Tentativa de rejeição sem permissão.';

      // Act & Assert - Tentar rejeitar com usuário sem permissão
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/reject`)
        .set('Authorization', `Bearer ${unauthorizedUser.accessToken}`)
        .send({ reason: rejectionReason })
        .expect(HttpStatus.FORBIDDEN);

      // Assert - Verificar que o status permaneceu PENDING
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.PENDING);
      expect(unchangedEnrollment?.resolved_at).toBeNull();
      expect(unchangedEnrollment?.rejection_reason).toBeNull();
    });

    it('Não deve permitir rejeição por dono de outro clube', async () => {
      // Arrange - Criar dependente e enrollment request
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'OutroClube',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.PENDING);

      const rejectionReason = 'Tentativa de rejeição de outro dono.';

      // Act & Assert - Tentar rejeitar com dono de outro clube
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/reject`)
        .set('Authorization', `Bearer ${otherClubOwner.accessToken}`)
        .send({ reason: rejectionReason })
        .expect(HttpStatus.FORBIDDEN);

      // Assert - Verificar que o status permaneceu PENDING
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.PENDING);
      expect(unchangedEnrollment?.resolved_at).toBeNull();
      expect(unchangedEnrollment?.rejection_reason).toBeNull();
    });

    it('Não deve rejeitar matrícula com ID inexistente', async () => {
      // Arrange - ID de enrollment inexistente
      const nonExistentId = crypto.randomUUID();
      const rejectionReason = 'Motivo para enrollment inexistente.';

      // Act & Assert - Tentar rejeitar deve retornar 404
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${nonExistentId}/reject`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .send({ reason: rejectionReason })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('Não deve permitir rejeição sem motivo', async () => {
      // Arrange - Criar dependente e enrollment request
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'SemMotivo',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.PENDING);

      // Act & Assert - Tentar rejeitar sem reason
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/reject`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      // Assert - Verificar que o status permaneceu PENDING
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.PENDING);
      expect(unchangedEnrollment?.resolved_at).toBeNull();
      expect(unchangedEnrollment?.rejection_reason).toBeNull();
    });

    it('Não deve permitir rejeição com motivo muito curto', async () => {
      // Arrange - Criar dependente e enrollment request
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'MotivoCurto',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.PENDING);

      const shortReason = 'Curto'; // Menos de 10 caracteres

      // Act & Assert - Tentar rejeitar com motivo muito curto
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/reject`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .send({ reason: shortReason })
        .expect(HttpStatus.BAD_REQUEST);

      // Assert - Verificar que o status permaneceu PENDING
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.PENDING);
      expect(unchangedEnrollment?.resolved_at).toBeNull();
      expect(unchangedEnrollment?.rejection_reason).toBeNull();
    });

    it('Não deve permitir rejeição com motivo vazio', async () => {
      // Arrange - Criar dependente e enrollment request
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'MotivoVazio',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.PENDING);

      // Act & Assert - Tentar rejeitar com reason vazio
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/reject`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .send({ reason: '' })
        .expect(HttpStatus.BAD_REQUEST);

      // Assert - Verificar que o status permaneceu PENDING
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.PENDING);
      expect(unchangedEnrollment?.resolved_at).toBeNull();
      expect(unchangedEnrollment?.rejection_reason).toBeNull();
    });

    it('Não deve permitir acesso sem token de autenticação', async () => {
      // Arrange - Criar enrollment request qualquer
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'SemToken',
      });

      const enrollmentRequest = await createTestEnrollmentRequest(prisma, testClub.id, dependant.id, testFamily.familyId, EnrollmentStatus.PENDING);

      const rejectionReason = 'Tentativa sem autenticação.';

      // Act & Assert - Tentar rejeitar sem token
      await request(app.getHttpServer())
        .post(`/club-management/enrollments/${enrollmentRequest.id}/reject`)
        .send({ reason: rejectionReason })
        .expect(HttpStatus.UNAUTHORIZED);

      // Assert - Verificar que o status permaneceu PENDING
      const unchangedEnrollment = await prisma.enrollmentRequest.findUnique({
        where: { id: enrollmentRequest.id },
      });
      expect(unchangedEnrollment?.status).toBe(EnrollmentStatus.PENDING);
      expect(unchangedEnrollment?.resolved_at).toBeNull();
      expect(unchangedEnrollment?.rejection_reason).toBeNull();
    });
  });
});
