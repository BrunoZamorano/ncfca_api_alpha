import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';

import { UserRoles } from '@/domain/enums/user-roles';

import { PrismaService } from '@/infraestructure/database/prisma.service';

import { AppModule } from '@/app.module';

import { createTestUser } from '../utils/prisma/create-test-user';

describe('E2E ApproveClubRequest', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: { userId: string; familyId: string; accessToken: string };
  let regularUser: { userId: string; familyId: string; accessToken: string };

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
  });

  afterAll(async () => {
    await prisma.clubMembership.deleteMany({ 
      where: { 
        club: { 
          principal_id: { 
            in: [admin.userId, regularUser.userId] 
          } 
        } 
      } 
    });
    await prisma.enrollmentRequest.deleteMany({ 
      where: { 
        club: { 
          principal_id: { 
            in: [admin.userId, regularUser.userId] 
          } 
        } 
      } 
    });
    await prisma.club.deleteMany({ 
      where: { 
        principal_id: { 
          in: [admin.userId, regularUser.userId] 
        } 
      } 
    });
    await prisma.clubRequest.deleteMany({ 
      where: { 
        requester_id: { 
          in: [admin.userId, regularUser.userId] 
        } 
      } 
    });
    await prisma.family.deleteMany({ 
      where: { 
        holder_id: { 
          in: [admin.userId, regularUser.userId] 
        } 
      } 
    });
    await prisma.user.deleteMany({ 
      where: { 
        id: { 
          in: [admin.userId, regularUser.userId] 
        } 
      } 
    });
    await app.close();
  });

  afterEach(async () => {
    await prisma.clubMembership.deleteMany({ 
      where: { 
        club: { 
          principal_id: { 
            in: [admin.userId, regularUser.userId] 
          } 
        } 
      } 
    });
    await prisma.enrollmentRequest.deleteMany({ 
      where: { 
        club: { 
          principal_id: { 
            in: [admin.userId, regularUser.userId] 
          } 
        } 
      } 
    });
    await prisma.club.deleteMany({ 
      where: { 
        principal_id: { 
          in: [admin.userId, regularUser.userId] 
        } 
      } 
    });
    await prisma.clubRequest.deleteMany({ 
      where: { 
        requester_id: { 
          in: [admin.userId, regularUser.userId] 
        } 
      } 
    });
  });

  it('Deve aprovar solicitação pendente e criar o clube', async () => {
    const clubRequest = await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Clube Aprovado E2E',
        requester_id: regularUser.userId,
        status: 'PENDING',
        city: 'Cidade',
        state: 'TS',
        street: 'Rua Teste',
        number: '123',
        zip_code: '12123123',
        neighborhood: 'bairro',
        max_members: 50,
      },
    });

    await request(app.getHttpServer())
      .post(`/club-requests/${clubRequest.id}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(HttpStatus.NO_CONTENT);

    const updatedRequest = await prisma.clubRequest.findUnique({
      where: { id: clubRequest.id },
    });
    expect(updatedRequest?.status).toBe('APPROVED');
    expect(updatedRequest?.resolved_at).toBeDefined();

    const createdClub = await prisma.club.findFirst({
      where: { principal_id: regularUser.userId },
    });
    expect(createdClub).toBeDefined();
    expect(createdClub?.name).toBe('Clube Aprovado E2E');
    expect(createdClub?.max_members).toBe(50);
    expect(createdClub?.city).toBe('Cidade');
    expect(createdClub?.state).toBe('TS');
  });

  it('Não deve aprovar solicitação já aprovada', async () => {
    const clubRequest = await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Clube Já Aprovado',
        requester_id: regularUser.userId,
        status: 'APPROVED',
        resolved_at: new Date(),
        city: 'Cidade',
        state: 'TS',
        street: 'Rua',
        number: '1',
        zip_code: '12123123',
        neighborhood: 'bairro',
      },
    });

    await request(app.getHttpServer())
      .post(`/club-requests/${clubRequest.id}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('Não deve aprovar solicitação já rejeitada', async () => {
    const clubRequest = await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Clube Rejeitado',
        requester_id: regularUser.userId,
        status: 'REJECTED',
        resolved_at: new Date(),
        rejection_reason: 'Motivo teste',
        city: 'Cidade',
        state: 'TS',
        street: 'Rua',
        number: '1',
        zip_code: '12123123',
        neighborhood: 'bairro',
      },
    });

    await request(app.getHttpServer())
      .post(`/club-requests/${clubRequest.id}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('Não deve aprovar solicitação inexistente', async () => {
    const fakeId = crypto.randomUUID();

    await request(app.getHttpServer())
      .post(`/club-requests/${fakeId}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(HttpStatus.NOT_FOUND);
  });

  it('Não deve permitir aprovação por usuário não-admin', async () => {
    const clubRequest = await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Clube Pendente',
        requester_id: admin.userId,
        status: 'PENDING',
        city: 'Cidade',
        state: 'TS',
        street: 'Rua',
        number: '1',
        zip_code: '12123123',
        neighborhood: 'bairro',
      },
    });

    await request(app.getHttpServer())
      .post(`/club-requests/${clubRequest.id}/approve`)
      .set('Authorization', `Bearer ${regularUser.accessToken}`)
      .expect(HttpStatus.FORBIDDEN);

    const unchangedRequest = await prisma.clubRequest.findUnique({
      where: { id: clubRequest.id },
    });
    expect(unchangedRequest?.status).toBe('PENDING');
  });

  it('Não deve permitir aprovação sem autenticação', async () => {
    const clubRequest = await prisma.clubRequest.create({
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

    await request(app.getHttpServer())
      .post(`/club-requests/${clubRequest.id}/approve`)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('Não deve permitir aprovação com token inválido', async () => {
    const clubRequest = await prisma.clubRequest.create({
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

    await request(app.getHttpServer())
      .post(`/club-requests/${clubRequest.id}/approve`)
      .set('Authorization', 'Bearer token-invalido')
      .expect(HttpStatus.UNAUTHORIZED);
  });
});