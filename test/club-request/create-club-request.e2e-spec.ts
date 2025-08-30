import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

import { UserRoles } from '@/domain/enums/user-roles';
import { FamilyStatus } from '@/domain/enums/family-status';

import { PrismaService } from '@/infraestructure/database/prisma.service';

import { AppModule } from '@/app.module';

import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';

describe('Club Request Creation (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let user: { userId: string; familyId: string; accessToken: string };
  const testUsers: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = app.get(PrismaService);
    user = await createTestUser(`${crypto.randomUUID()}@test.com`, [UserRoles.SEM_FUNCAO], prisma, app, FamilyStatus.AFFILIATED);
    testUsers.push(user.userId);
  });

  afterAll(async () => {
    await surgicalCleanup(prisma, testUsers);
    await app.close();
  });

  afterEach(async () => {
    await prisma.clubRequest.deleteMany({ where: { requester_id: user.userId } });
    await prisma.club.deleteMany({ where: { principal_id: user.userId } });
  });

  const createRequestDto = {
    clubName: 'Meu Clube E2E',
    address: { street: 'Rua E2E', number: '100', district: 'Bairro Teste', city: 'Cidade', state: 'TS', zipCode: '98789877' },
  };

  it('POST /club-requests: Deve criar uma nova solicitação', async () => {
    await request(app.getHttpServer())
      .post('/club-requests')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(createRequestDto)
      .expect(HttpStatus.ACCEPTED);
    const requestInDb = await prisma.clubRequest.findFirst({
      where: { requester_id: user.userId },
    });
    expect(requestInDb).toBeDefined();
    expect(requestInDb?.club_name).toBe(createRequestDto.clubName);
  });

  it('POST /club-requests: Não deve criar se o usuário já tiver uma solicitação pendente', async () => {
    await request(app.getHttpServer()).post('/club-requests').set('Authorization', `Bearer ${user.accessToken}`).send(createRequestDto);
    await request(app.getHttpServer())
      .post('/club-requests')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ ...createRequestDto, clubName: 'Segunda Tentativa Invalida' })
      .expect(HttpStatus.CONFLICT);
  });

  it('POST /club-requests: Não deve criar se o usuário já for dono de um clube', async () => {
    await prisma.club.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Clube Existente',
        principal_id: user.userId,
        city: 'Cidade',
        state: 'TS',
        street: 'Rua',
        number: '1',
        zip_code: '12123123',
        neighborhood: 'bairro',
      },
    });
    await request(app.getHttpServer())
      .post('/club-requests')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(createRequestDto)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('POST /club-requests: Não deve criar se nenhum token for fornecido', async () => {
    await request(app.getHttpServer()).post('/club-requests').send(createRequestDto).expect(HttpStatus.UNAUTHORIZED);
  });
});
