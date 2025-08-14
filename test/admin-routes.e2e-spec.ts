import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';

import { UserRoles } from '@/domain/enums/user-roles';
import { FamilyStatus } from '@/domain/enums/family-status';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { DependantType } from '@/domain/enums/dependant-type.enum';
import { Sex } from '@/domain/enums/sex';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';
import { PrismaService } from '@/infraestructure/database/prisma.service';

import { AppModule } from '@/app.module';
import { createTestUser } from './utils/prisma/create-test-user';
import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';

describe('E2E AdminRoutes', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminUser: { userId: string; familyId: string; accessToken: string };
  let familyUser: { userId: string; familyId: string; accessToken: string };
  let clubOwner: { userId: string; familyId: string; accessToken: string };
  let testClubId: string;
  let testDependantId: string;
  let testEnrollmentRequestId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // Criar usuários de teste
    adminUser = await createTestUser(`admin-routes-${crypto.randomUUID()}@test.com`, [UserRoles.ADMIN], prisma, app);
    familyUser = await createTestUser(`family-routes-${crypto.randomUUID()}@test.com`, [UserRoles.SEM_FUNCAO], prisma, app);
    clubOwner = await createTestUser(`owner-routes-${crypto.randomUUID()}@test.com`, [UserRoles.DONO_DE_CLUBE], prisma, app);

    // Criar clube de teste
    const clubData = {
      id: crypto.randomUUID(),
      name: 'Test Admin Routes Club',
      principal_id: clubOwner.userId,
      city: 'Test City',
      state: 'TS',
      number: '123',
      street: 'Test Street',
      zip_code: '12345678',
      neighborhood: 'Test Neighborhood',
      max_members: 5,
    };
    const club = await prisma.club.create({ data: clubData });
    testClubId = club.id;

    // Afiliar família do usuário
    await prisma.family.update({
      where: { id: familyUser.familyId },
      data: { status: FamilyStatus.AFFILIATED, affiliation_expires_at: new Date(Date.now() + 86400000) },
    });

    // Criar dependente de teste
    const dependantData = {
      id: crypto.randomUUID(),
      first_name: 'Test',
      last_name: 'Dependant',
      family_id: familyUser.familyId,
      sex: Sex.MALE,
      relationship: DependantRelationship.SON,
      type: DependantType.STUDENT,
      birthdate: new Date('2010-01-01'),
      email: 'test@dependant.com',
      phone: '11999999999',
    };
    const dependant = await prisma.dependant.create({ data: dependantData });
    testDependantId = dependant.id;

    // Criar solicitação de matrícula pendente
    const enrollmentRequestData = {
      id: crypto.randomUUID(),
      member_id: testDependantId,
      family_id: familyUser.familyId,
      club_id: testClubId,
      status: EnrollmentStatus.PENDING,
    };
    const enrollmentRequest = await prisma.enrollmentRequest.create({ data: enrollmentRequestData });
    testEnrollmentRequestId = enrollmentRequest.id;
  });

  afterAll(async () => {
    // Cleanup in correct order
    try {
      await prisma.clubMembership.deleteMany({ where: { member_id: testDependantId } });
      await prisma.enrollmentRequest.deleteMany({ where: { member_id: testDependantId } });
      await prisma.dependant.deleteMany({
        where: {
          OR: [{ family_id: adminUser.familyId }, { family_id: familyUser.familyId }, { family_id: clubOwner.familyId }],
        },
      });
      await prisma.club.deleteMany({ where: { id: testClubId } });
      await prisma.family.deleteMany({
        where: {
          OR: [{ id: adminUser.familyId }, { id: familyUser.familyId }, { id: clubOwner.familyId }],
        },
      });
      await prisma.user.deleteMany({
        where: {
          OR: [{ id: adminUser.userId }, { id: familyUser.userId }, { id: clubOwner.userId }],
        },
      });
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
    await app.close();
  });

  describe('GET /admin/clubs/:clubId/members', () => {
    it('Deve listar membros do clube com sucesso', async () => {
      // Arrange - Criar um membro no clube
      await prisma.clubMembership.create({
        data: {
          id: crypto.randomUUID(),
          club_id: testClubId,
          member_id: testDependantId,
          family_id: familyUser.familyId,
          status: 'ACTIVE',
        },
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get(`/admin/clubs/${testClubId}/members`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('members');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('Não deve listar membros sem token de autorização', async () => {
      // Act & Assert
      await request(app.getHttpServer()).get(`/admin/clubs/${testClubId}/members`).expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /admin/clubs/:clubId/enrollments/pending', () => {
    it('Deve listar solicitações pendentes com sucesso', async () => {
      // Act & Assert
      const response = await request(app.getHttpServer())
        .get(`/admin/clubs/${testClubId}/enrollments/pending`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('dependantId');
      expect(response.body[0]).toHaveProperty('dependantName');
      expect(response.body[0]).toHaveProperty('status');
    });

    it('Não deve listar sem token de autorização', async () => {
      // Act & Assert
      await request(app.getHttpServer()).get(`/admin/clubs/${testClubId}/enrollments/pending`).expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /admin/clubs/:clubId/charts', () => {
    it('Deve obter dados de gráficos com sucesso', async () => {
      // Act & Assert
      const response = await request(app.getHttpServer())
        .get(`/admin/clubs/${testClubId}/charts`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('memberCountByType');
      expect(response.body).toHaveProperty('enrollmentsOverTime');
      expect(response.body).toHaveProperty('memberCountBySex');
      expect(response.body).toHaveProperty('totalActiveMembers');
      expect(response.body).toHaveProperty('totalPendingEnrollments');
    });

    it('Não deve obter gráficos sem token de autorização', async () => {
      // Act & Assert
      await request(app.getHttpServer()).get(`/admin/clubs/${testClubId}/charts`).expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /admin/clubs/:clubId/enrollments/:enrollmentId/approve', () => {
    it('Deve aprovar solicitação com sucesso', async () => {
      // Arrange - Criar novo dependant para este teste
      const newDependant = await prisma.dependant.create({
        data: {
          id: crypto.randomUUID(),
          first_name: 'TestApprove',
          last_name: 'User',
          family_id: familyUser.familyId,
          relationship: DependantRelationship.SON,
          type: DependantType.STUDENT,
          sex: Sex.MALE,
          birthdate: new Date('2010-01-01'),
        },
      });

      // Criar nova solicitação para aprovar
      const newEnrollmentData = {
        id: crypto.randomUUID(),
        member_id: newDependant.id,
        family_id: familyUser.familyId,
        club_id: testClubId,
        status: EnrollmentStatus.PENDING,
      };
      const newEnrollment = await prisma.enrollmentRequest.create({ data: newEnrollmentData });

      // Act & Assert
      await request(app.getHttpServer())
        .post(`/admin/clubs/${testClubId}/enrollments/${newEnrollment.id}/approve`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verificar se foi aprovada
      const updatedRequest = await prisma.enrollmentRequest.findUnique({
        where: { id: newEnrollment.id },
      });
      expect(updatedRequest?.status).toBe(EnrollmentStatus.APPROVED);
    });

    it('Não deve aprovar sem token de autorização', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .post(`/admin/clubs/${testClubId}/enrollments/${testEnrollmentRequestId}/approve`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /admin/clubs/:clubId/enrollments/:enrollmentId/reject', () => {
    it('Deve rejeitar solicitação com sucesso', async () => {
      // Arrange - Criar nova solicitação para rejeitar
      const newEnrollmentData = {
        id: crypto.randomUUID(),
        member_id: testDependantId,
        family_id: familyUser.familyId,
        club_id: testClubId,
        status: EnrollmentStatus.PENDING,
      };
      const newEnrollment = await prisma.enrollmentRequest.create({ data: newEnrollmentData });

      // Act & Assert
      await request(app.getHttpServer())
        .post(`/admin/clubs/${testClubId}/enrollments/${newEnrollment.id}/reject`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send({ rejectionReason: 'Test rejection reason' })
        .expect(HttpStatus.NO_CONTENT);

      // Verificar se foi rejeitada
      const updatedRequest = await prisma.enrollmentRequest.findUnique({
        where: { id: newEnrollment.id },
      });
      expect(updatedRequest?.status).toBe(EnrollmentStatus.REJECTED);
    });

    it('Não deve rejeitar sem token de autorização', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .post(`/admin/clubs/${testClubId}/enrollments/${testEnrollmentRequestId}/reject`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
