import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';

import { UserRoles } from '@/domain/enums/user-roles';

import { PrismaService } from '@/infraestructure/database/prisma.service';

import { AppModule } from '@/app.module';

import { createTestUser } from '../utils/prisma/create-test-user';
import { FamilyStatus } from '@/domain/enums/family-status';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { DependantType } from '@/domain/enums/dependant-type.enum';
import { Sex } from '@/domain/enums/sex';

describe('E2E RequestEnrollment', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let user: { userId: string; familyId: string; accessToken: string };
  let clubOwner: { userId: string; familyId: string; accessToken: string };
  let testClubId: string;
  let testDependantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Criar usuários de teste
    user = await createTestUser(`user-simple-${crypto.randomUUID()}@test.com`, [UserRoles.SEM_FUNCAO], prisma, app);
    clubOwner = await createTestUser(`owner-${crypto.randomUUID()}@test.com`, [UserRoles.DONO_DE_CLUBE], prisma, app);

    // Criar clube de teste
    const clubData = {
      id: crypto.randomUUID(),
      name: 'Test Club for RequestEnrollment',
      principal_id: clubOwner.userId,
      city: 'Test City',
      state: 'TS',
      number: '123',
      street: 'Test Street',
      zip_code: '12345678',
      neighborhood: 'Test Neighborhood',
    };
    const club = await prisma.club.create({ data: clubData });
    testClubId = club.id;

    // Afiliar família do usuário
    await prisma.family.update({
      where: { id: user.familyId },
      data: { status: FamilyStatus.AFFILIATED, affiliation_expires_at: new Date(Date.now() + 86400000) },
    });

    // Criar dependente de teste
    const dependantData = {
      id: crypto.randomUUID(),
      first_name: 'Test',
      last_name: 'Dependant',
      family_id: user.familyId,
      sex: Sex.MALE,
      relationship: DependantRelationship.SON,
      type: DependantType.STUDENT,
      birthdate: new Date('2010-01-01'),
    };
    const dependant = await prisma.dependant.create({ data: dependantData });
    testDependantId = dependant.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.enrollmentRequest.deleteMany({ where: { member_id: testDependantId } });
    await prisma.dependant.deleteMany({ where: { OR: [{ family_id: user.familyId }, { family_id: clubOwner.familyId }] } });
    await prisma.club.deleteMany({ where: { id: testClubId } });
    await prisma.family.deleteMany({ where: { OR: [{ id: user.familyId }, { id: clubOwner.familyId }] } });
    await prisma.user.deleteMany({ where: { OR: [{ id: user.userId }, { id: clubOwner.userId }] } });
    await app.close();
  });

  it('Deve criar solicitação de matrícula com sucesso', async () => {
    // Arrange
    const enrollmentRequestDto = {
      dependantId: testDependantId,
      clubId: testClubId,
    };

    // Act & Assert
    await request(app.getHttpServer())
      .post('/enrollments')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(enrollmentRequestDto)
      .expect(HttpStatus.CREATED);

    // Verificar no banco de dados
    const createdRequest = await prisma.enrollmentRequest.findFirst({
      where: { member_id: testDependantId, club_id: testClubId },
    });
    expect(createdRequest).toBeTruthy();
    expect(createdRequest?.status).toBe('PENDING');
  });

  it('Deve validar entrada corretamente', async () => {
    // Arrange
    const enrollmentRequestDto = {
      dependantId: 'fake-dependant-id',
      clubId: 'fake-club-id',
    };

    // Act
    const enrollmentResponse = await request(app.getHttpServer())
      .post('/enrollments')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(enrollmentRequestDto);

    // Assert
    expect([HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.FORBIDDEN]).toContain(
      enrollmentResponse.status,
    );
  });

  it('Não deve criar solicitação sem token de autorização', async () => {
    // Arrange
    const enrollmentRequestDto = {
      dependantId: 'any-dependant-id',
      clubId: 'any-club-id',
    };

    // Act & Assert
    await request(app.getHttpServer()).post('/enrollments').send(enrollmentRequestDto).expect(HttpStatus.UNAUTHORIZED);
  });

  it('Não deve criar solicitação sem dependantId', async () => {
    // Arrange
    const incompleteDto = { clubId: 'some-club-id' };

    // Act & Assert
    await request(app.getHttpServer())
      .post('/enrollments')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(incompleteDto)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('Não deve criar solicitação sem clubId', async () => {
    // Arrange
    const incompleteDto = { dependantId: 'some-dependant-id' };

    // Act & Assert
    await request(app.getHttpServer())
      .post('/enrollments')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(incompleteDto)
      .expect(HttpStatus.BAD_REQUEST);
  });
});
