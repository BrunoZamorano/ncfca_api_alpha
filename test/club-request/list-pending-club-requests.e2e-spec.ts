import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { UserRoles } from '@/domain/enums/user-roles';

import { PrismaService } from '@/infraestructure/database/prisma.service';

import { AppModule } from '@/app.module';

import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';
import { ClubRequestStatus } from '@/domain/enums/club-request-status.enum';

import { ClubRequest as ClubRequestModel } from '@prisma/client';

describe('E2E ListPendingClubRequests', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: { userId: string; familyId: string; accessToken: string };
  let regularUser: { userId: string; familyId: string; accessToken: string };
  const testUsers: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = app.get(PrismaService);
    admin = await createTestUser(`admin-${crypto.randomUUID()}@test.com`, [UserRoles.ADMIN], prisma, app);
    regularUser = await createTestUser(`user-${crypto.randomUUID()}@test.com`, [UserRoles.SEM_FUNCAO], prisma, app);
    testUsers.push(admin.userId, regularUser.userId);
  });

  afterAll(async () => {
    await surgicalCleanup(prisma, testUsers);
    await app.close();
  });

  afterEach(async () => {
    await prisma.clubRequest.deleteMany({
      where: {
        OR: [{ requester_id: admin.userId }, { requester_id: regularUser.userId }],
      },
    });
  });

  it('Deve retornar lista vazia quando não há solicitações pendentes', async () => {
    await prisma.clubRequest.deleteMany({});

    const response = await request(app.getHttpServer())
      .get('/club-requests/pending')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(HttpStatus.OK);

    expect(response.body).toEqual([]);
  });

  it('Deve retornar todas as solicitações pendentes', async () => {
    const pendingRequest1 = await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Clube Pendente 1',
        requester_id: regularUser.userId,
        status: 'PENDING',
        city: 'Cidade',
        state: 'TS',
        street: 'Rua',
        number: '1',
        zip_code: '12123123',
        neighborhood: 'bairro',
      },
    });

    const response = await request(app.getHttpServer())
      .get('/club-requests/pending')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(HttpStatus.OK);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: pendingRequest1.id,
          clubName: 'Clube Pendente 1',
          status: 'PENDING',
        }),
      ]),
    );
  });

  it('Não deve incluir solicitações aprovadas ou rejeitadas', async () => {
    await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Clube Pendente',
        requester_id: regularUser.userId,
        status: 'PENDING',
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
        club_name: 'Clube Aprovado',
        requester_id: regularUser.userId,
        status: 'APPROVED',
        city: 'Cidade',
        state: 'TS',
        street: 'Rua',
        number: '2',
        zip_code: '12123124',
        neighborhood: 'bairro',
      },
    });

    await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Clube Rejeitado',
        requester_id: regularUser.userId,
        status: 'REJECTED',
        rejection_reason: 'Teste',
        city: 'Cidade',
        state: 'TS',
        street: 'Rua',
        number: '3',
        zip_code: '12123125',
        neighborhood: 'bairro',
      },
    });

    const query: ClubRequestModel[] = await prisma.clubRequest.findMany({
      where: {
        status: ClubRequestStatus.PENDING,
      },
    });

    const response = await request(app.getHttpServer())
      .get('/club-requests/pending')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(HttpStatus.OK);

    expect(response.body).toHaveLength(query.length);
    expect(response.body[0]).toMatchObject({
      clubName: 'Clube Pendente',
      status: 'PENDING',
    });
  });

  it('Não deve permitir acesso sem autenticação', async () => {
    await request(app.getHttpServer()).get('/club-requests/pending').expect(HttpStatus.UNAUTHORIZED);
  });

  it('Não deve permitir acesso para usuários não-admin', async () => {
    await request(app.getHttpServer())
      .get('/club-requests/pending')
      .set('Authorization', `Bearer ${regularUser.accessToken}`)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('Não deve permitir acesso com token inválido', async () => {
    await request(app.getHttpServer()).get('/club-requests/pending').set('Authorization', 'Bearer token-invalido').expect(HttpStatus.UNAUTHORIZED);
  });
});
