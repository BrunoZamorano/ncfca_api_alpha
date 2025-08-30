import * as request from 'supertest';
import { NestExpressApplication } from '@nestjs/platform-express';
import { EnrollmentStatus } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { MyEnrollmentRequestItemView } from '@/application/queries/enrollment-query/my-enrollment-request-item.view';

import {
  setupEnrollmentApp,
  createRegularUser,
  createTestClub,
  createTestDependant,
  enrollmentCleanup,
  EnrollmentTestUser,
  ClubTestData,
} from './setup';

describe('(E2E) ListMyEnrollmentRequests', () => {
  let app: NestExpressApplication;
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Deve retornar uma lista de solicitações de matrícula da família do usuário', async () => {
    // Arrange - Criar uma solicitação de matrícula
    await prisma.enrollmentRequest.create({
      data: {
        id: crypto.randomUUID(),
        member_id: testDependant.id,
        club_id: testClub.id,
        family_id: testUser.familyId,
        status: EnrollmentStatus.PENDING,
        requested_at: new Date(),
      },
    });

    // Act
    const response = await request(app.getHttpServer()).get('/enrollments/my-requests').set('Authorization', `Bearer ${testUser.accessToken}`);

    // Assert
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    const enrollmentRequest = response.body[0] as MyEnrollmentRequestItemView;
    expect(enrollmentRequest).toHaveProperty('id');
    expect(enrollmentRequest).toHaveProperty('status');
    expect(enrollmentRequest).toHaveProperty('clubName');
    expect(enrollmentRequest).toHaveProperty('dependantName');
    expect(enrollmentRequest).toHaveProperty('requestedAt');
    expect(enrollmentRequest.status).toBe(EnrollmentStatus.PENDING);
  });

  it('Deve retornar uma lista vazia se não existirem solicitações', async () => {
    // Arrange - Criar novo usuário sem solicitações
    const userWithoutRequests = await createRegularUser(app, prisma);
    testUserIds.push(userWithoutRequests.userId);

    // Act
    const response = await request(app.getHttpServer())
      .get('/enrollments/my-requests')
      .set('Authorization', `Bearer ${userWithoutRequests.accessToken}`);

    // Assert
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it('Não deve retornar solicitações de outras famílias', async () => {
    // Arrange - Criar outro usuário e família
    const anotherUser = await createRegularUser(app, prisma);
    testUserIds.push(anotherUser.userId);

    const anotherDependant = await createTestDependant(prisma, anotherUser.familyId);

    // Criar solicitação para a outra família
    await prisma.enrollmentRequest.create({
      data: {
        id: crypto.randomUUID(),
        member_id: anotherDependant.id,
        club_id: testClub.id,
        family_id: anotherUser.familyId,
        status: EnrollmentStatus.PENDING,
        requested_at: new Date(),
      },
    });

    // Act - Buscar como o primeiro usuário
    const response = await request(app.getHttpServer()).get('/enrollments/my-requests').set('Authorization', `Bearer ${testUser.accessToken}`);

    // Assert - Deve retornar apenas as solicitações da própria família
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    // Verificar que nenhuma das solicitações retornadas pertence à outra família
    const userFamilyRequests = response.body.filter(
      (req: any) => req.id !== undefined, // Only valid requests from this user's family
    );

    // Se existem solicitações, devem ser apenas da família do usuário testado
    for (const req of userFamilyRequests) {
      const dbRequest = await prisma.enrollmentRequest.findUnique({
        where: { id: req.id },
      });
      expect(dbRequest?.family_id).toBe(testUser.familyId);
    }
  });

  it('Não deve retornar solicitações sem autenticação', async () => {
    // Act
    const response = await request(app.getHttpServer()).get('/enrollments/my-requests');

    // Assert
    expect(response.status).toBe(401);
  });
});
