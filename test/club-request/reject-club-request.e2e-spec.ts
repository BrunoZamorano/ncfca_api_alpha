import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';

import { UserRoles } from '@/domain/enums/user-roles';

import { PrismaService } from '@/infraestructure/database/prisma.service';

import { AppModule } from '@/app.module';

import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';

describe('E2E RejectClubRequest', () => {
  let app: INestApplication;
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
        requester_id: { 
          in: [admin.userId, regularUser.userId] 
        } 
      } 
    });
  });

  it('Deve rejeitar solicitação pendente com motivo válido', async () => {
    const clubRequest = await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Clube Rejeitado E2E',
        requester_id: regularUser.userId,
        status: 'PENDING',
        city: 'Cidade',
        state: 'TS',
        street: 'Rua Teste',
        number: '123',
        zip_code: '12123123',
        neighborhood: 'bairro',
      },
    });

    const rejectionReason = 'Documentação insuficiente para aprovação do clube';

    await request(app.getHttpServer())
      .post(`/club-requests/${clubRequest.id}/reject`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: rejectionReason })
      .expect(HttpStatus.NO_CONTENT);

    const updatedRequest = await prisma.clubRequest.findUnique({
      where: { id: clubRequest.id },
    });
    expect(updatedRequest?.status).toBe('REJECTED');
    expect(updatedRequest?.rejection_reason).toBe(rejectionReason);
    expect(updatedRequest?.resolved_at).toBeDefined();
  });

  it('Não deve rejeitar sem fornecer motivo', async () => {
    const clubRequest = await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Clube Sem Motivo',
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
      .post(`/club-requests/${clubRequest.id}/reject`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({})
      .expect(HttpStatus.BAD_REQUEST);

    const unchangedRequest = await prisma.clubRequest.findUnique({
      where: { id: clubRequest.id },
    });
    expect(unchangedRequest?.status).toBe('PENDING');
    expect(unchangedRequest?.rejection_reason).toBeNull();
  });

  it('Não deve rejeitar com motivo vazio', async () => {
    const clubRequest = await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Clube Motivo Vazio',
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
      .post(`/club-requests/${clubRequest.id}/reject`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: '' })
      .expect(HttpStatus.BAD_REQUEST);

    await request(app.getHttpServer())
      .post(`/club-requests/${clubRequest.id}/reject`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: '   ' })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('Não deve rejeitar solicitação já aprovada', async () => {
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
      .post(`/club-requests/${clubRequest.id}/reject`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Tentativa de rejeitar aprovado' })
      .expect(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('Não deve rejeitar solicitação já rejeitada', async () => {
    const clubRequest = await prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        club_name: 'Clube Já Rejeitado',
        requester_id: regularUser.userId,
        status: 'REJECTED',
        resolved_at: new Date(),
        rejection_reason: 'Motivo anterior',
        city: 'Cidade',
        state: 'TS',
        street: 'Rua',
        number: '1',
        zip_code: '12123123',
        neighborhood: 'bairro',
      },
    });

    await request(app.getHttpServer())
      .post(`/club-requests/${clubRequest.id}/reject`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Novo motivo' })
      .expect(HttpStatus.INTERNAL_SERVER_ERROR);

    const unchangedRequest = await prisma.clubRequest.findUnique({
      where: { id: clubRequest.id },
    });
    expect(unchangedRequest?.rejection_reason).toBe('Motivo anterior');
  });

  it('Não deve rejeitar solicitação inexistente', async () => {
    const fakeId = crypto.randomUUID();

    await request(app.getHttpServer())
      .post(`/club-requests/${fakeId}/reject`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Motivo válido' })
      .expect(HttpStatus.NOT_FOUND);
  });

  it('Não deve permitir rejeição por usuário não-admin', async () => {
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
      .post(`/club-requests/${clubRequest.id}/reject`)
      .set('Authorization', `Bearer ${regularUser.accessToken}`)
      .send({ reason: 'Tentativa não autorizada' })
      .expect(HttpStatus.FORBIDDEN);

    const unchangedRequest = await prisma.clubRequest.findUnique({
      where: { id: clubRequest.id },
    });
    expect(unchangedRequest?.status).toBe('PENDING');
  });

  it('Não deve permitir rejeição sem autenticação', async () => {
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
      .post(`/club-requests/${clubRequest.id}/reject`)
      .send({ reason: 'Motivo válido' })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('Não deve permitir rejeição com token inválido', async () => {
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
      .post(`/club-requests/${clubRequest.id}/reject`)
      .set('Authorization', 'Bearer token-invalido')
      .send({ reason: 'Motivo válido' })
      .expect(HttpStatus.UNAUTHORIZED);
  });
});