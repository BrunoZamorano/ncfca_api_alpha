import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { AppModule } from '@/app.module';
import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';
import { UserRoles } from '@/domain/enums/user-roles';

describe('E2E Login', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let userId: string;
  const testUsers: string[] = [];
  const testEmail = `e2e-login-${crypto.randomUUID()}@test.com`;
  const testPassword = 'Password@123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = app.get(PrismaService);
    const testUser = await createTestUser(testEmail, [UserRoles.SEM_FUNCAO], prisma, app);
    userId = testUser.userId;
    testUsers.push(userId);
  });

  afterAll(async () => {
    await surgicalCleanup(prisma, testUsers);
    await app.close();
  });

  it('Deve autenticar com credenciais válidas e retornar os tokens', async () => {
    const loginDto = { email: testEmail, password: testPassword };

    const response = await request(app.getHttpServer()).post('/auth/login').send(loginDto).expect(HttpStatus.OK);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it('Não deve autenticar com senha incorreta', async () => {
    const loginDto = { email: testEmail, password: 'wrongpassword' };

    await request(app.getHttpServer()).post('/auth/login').send(loginDto).expect(HttpStatus.UNAUTHORIZED);
  });

  it('Não deve autenticar com email inexistente', async () => {
    const loginDto = { email: 'nonexistent@test.com', password: testPassword };

    await request(app.getHttpServer()).post('/auth/login').send(loginDto).expect(HttpStatus.UNAUTHORIZED);
  });

  it('Não deve autenticar com payload inválido', async () => {
    await request(app.getHttpServer()).post('/auth/login').send({ email: testEmail }).expect(HttpStatus.BAD_REQUEST);
    await request(app.getHttpServer()).post('/auth/login').send({ password: testPassword }).expect(HttpStatus.BAD_REQUEST);
    await request(app.getHttpServer()).post('/auth/login').send({}).expect(HttpStatus.BAD_REQUEST);
  });
});
