import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';

import {
  setupEnrollmentApp,
  createRegularUser,
  createTestClub,
  createTestDependant,
  enrollmentCleanup,
  EnrollmentTestUser,
  ClubTestData,
} from './setup';

describe('(E2E) RequestEnrollment', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUser: EnrollmentTestUser;
  let testClub: ClubTestData;
  let testDependant: any;
  let clubOwnerUser: EnrollmentTestUser;
  const testUserIds: string[] = [];

  beforeAll(async () => {
    const setup = await setupEnrollmentApp();
    app = setup.app;
    prisma = setup.prisma;

    // Criar usuário proprietário do clube
    clubOwnerUser = await createRegularUser(app, prisma);
    testUserIds.push(clubOwnerUser.userId);

    // Criar clube de teste
    testClub = await createTestClub(prisma, clubOwnerUser.userId);

    // Criar usuário regular para testes
    testUser = await createRegularUser(app, prisma);
    testUserIds.push(testUser.userId);

    // Criar dependente para o usuário
    testDependant = await createTestDependant(prisma, testUser.familyId);
  });

  afterAll(async () => {
    await enrollmentCleanup(prisma, testUserIds);
    await app.close();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('Deve criar uma solicitação de matrícula com sucesso', async () => {
    // Arrange
    const enrollmentData = {
      dependantId: testDependant.id,
      clubId: testClub.id,
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/enrollments')
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .send(enrollmentData);

    // Assert
    expect(response.status).toBe(201);

    // Verificar no banco se a solicitação foi criada
    const createdRequest = await prisma.enrollmentRequest.findFirst({
      where: {
        member_id: testDependant.id,
        club_id: testClub.id,
        family_id: testUser.familyId,
      },
    });

    expect(createdRequest).toBeDefined();
    expect(createdRequest?.status).toBe(EnrollmentStatus.PENDING);
  });

  it('Não deve criar solicitação sem autenticação', async () => {
    // Arrange
    const enrollmentData = {
      dependantId: testDependant.id,
      clubId: testClub.id,
    };

    // Act
    const response = await request(app.getHttpServer()).post('/enrollments').send(enrollmentData);

    // Assert
    expect(response.status).toBe(401);
  });

  it('Não deve criar solicitação com clubId inexistente', async () => {
    // Arrange
    const nonExistentClubId = crypto.randomUUID();
    const enrollmentData = {
      dependantId: testDependant.id,
      clubId: nonExistentClubId,
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/enrollments')
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .send(enrollmentData);

    // Assert
    expect(response.status).toBe(404);
  });

  it('Não deve criar solicitação com dependantId inexistente', async () => {
    // Arrange
    const nonExistentDependantId = crypto.randomUUID();
    const enrollmentData = {
      dependantId: nonExistentDependantId,
      clubId: testClub.id,
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/enrollments')
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .send(enrollmentData);

    // Assert
    expect(response.status).toBe(403);
  });

  it('Não deve criar solicitação para dependente de outra família', async () => {
    // Arrange - Criar outro usuário e dependente
    const anotherUser = await createRegularUser(app, prisma);
    testUserIds.push(anotherUser.userId);

    const anotherDependant = await createTestDependant(prisma, anotherUser.familyId);

    const enrollmentData = {
      dependantId: anotherDependant.id,
      clubId: testClub.id,
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/enrollments')
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .send(enrollmentData);

    // Assert
    expect(response.status).toBe(403);
  });

  it('Não deve criar solicitação com clubId em formato inválido', async () => {
    // Arrange
    const enrollmentData = {
      dependantId: testDependant.id,
      clubId: 'invalid-uuid-format',
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/enrollments')
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .send(enrollmentData);

    // Assert
    expect(response.status).toBe(400);
  });

  it('Não deve criar solicitação com dependantId em formato inválido', async () => {
    // Arrange
    const enrollmentData = {
      dependantId: 'invalid-uuid-format',
      clubId: testClub.id,
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/enrollments')
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .send(enrollmentData);

    // Assert
    expect(response.status).toBe(400);
  });

  it('Não deve criar solicitação duplicada pendente', async () => {
    // Arrange - Criar outro dependente para evitar conflito com testes anteriores
    const anotherDependant = await createTestDependant(prisma, testUser.familyId, {
      firstName: 'Pedro',
      lastName: 'Duplicate',
    });

    const enrollmentData = {
      dependantId: anotherDependant.id,
      clubId: testClub.id,
    };

    // Act - Primeira solicitação (deve funcionar)
    const firstResponse = await request(app.getHttpServer())
      .post('/enrollments')
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .send(enrollmentData);

    expect(firstResponse.status).toBe(201);

    // Act - Segunda solicitação (deve falhar)
    const secondResponse = await request(app.getHttpServer())
      .post('/enrollments')
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .send(enrollmentData);

    // Assert
    expect(secondResponse.status).toBe(400);
  });
});
