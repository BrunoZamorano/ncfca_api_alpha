import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';

import { UserRoles } from '@/domain/enums/user-roles';

import { PrismaService } from '@/infraestructure/database/prisma.service';

import { AppModule } from '@/app.module';

import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';

describe('E2E GetUserClubRequests', () => {
  let app: INestApplication;
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
    user = await createTestUser(`${crypto.randomUUID()}@test.com`, [UserRoles.SEM_FUNCAO], prisma, app);
    testUsers.push(user.userId);
  });

  afterAll(async () => {
    await surgicalCleanup(prisma, testUsers);
    await app.close();
  });

  afterEach(async () => {
    await prisma.clubRequest.deleteMany({ where: { requester_id: user.userId } });
  });

  it('Deve retornar lista vazia quando usuário não tem solicitações', async () => {
    const response = await request(app.getHttpServer())
      .get('/club-requests/my-requests')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(HttpStatus.OK);

    expect(response.body).toEqual([]);
  });

  it('Deve retornar as solicitações do usuário autenticado', async () => {
    const clubRequest1 = await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Primeiro Clube',
        requester_id: user.userId,
        city: 'Cidade',
        state: 'TS',
        street: 'Rua',
        number: '1',
        zip_code: '12123123',
        neighborhood: 'bairro',
      },
    });

    const clubRequest2 = await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Segundo Clube',
        requester_id: user.userId,
        city: 'Cidade',
        state: 'TS',
        street: 'Rua',
        number: '2',
        zip_code: '12123124',
        neighborhood: 'bairro',
      },
    });

    const response = await request(app.getHttpServer())
      .get('/club-requests/my-requests')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(HttpStatus.OK);

    expect(response.body).toHaveLength(2);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: clubRequest1.id,
          clubName: 'Primeiro Clube',
          status: 'PENDING',
        }),
        expect.objectContaining({
          id: clubRequest2.id,
          clubName: 'Segundo Clube',
          status: 'PENDING',
        }),
      ])
    );
  });

  it('Não deve retornar solicitações de outros usuários', async () => {
    const otherUser = await createTestUser(`${crypto.randomUUID()}@test.com`, [UserRoles.SEM_FUNCAO], prisma, app);
    testUsers.push(otherUser.userId);

    await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Clube do Outro',
        requester_id: otherUser.userId,
        city: 'Cidade',
        state: 'TS',
        street: 'Rua',
        number: '1',
        zip_code: '12123123',
        neighborhood: 'bairro',
      },
    });

    await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Meu Clube',
        requester_id: user.userId,
        city: 'Cidade',
        state: 'TS',
        street: 'Rua',
        number: '2',
        zip_code: '12123124',
        neighborhood: 'bairro',
      },
    });

    const response = await request(app.getHttpServer())
      .get('/club-requests/my-requests')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(HttpStatus.OK);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      clubName: 'Meu Clube',
    });

  });

  it('Não deve permitir acesso sem autenticação', async () => {
    await request(app.getHttpServer())
      .get('/club-requests/my-requests')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('Não deve permitir acesso com token inválido', async () => {
    await request(app.getHttpServer())
      .get('/club-requests/my-requests')
      .set('Authorization', 'Bearer token-invalido')
      .expect(HttpStatus.UNAUTHORIZED);
  });
});