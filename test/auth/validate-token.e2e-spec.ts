import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { AppModule } from '@/app.module';
import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';
import { UserRoles } from '@/domain/enums/user-roles';
import { ValidateTokenOutputDto } from '@/infraestructure/dtos/validate-token.dto';

describe('E2E ValidateToken', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let userId: string;
  let accessToken: string;
  const testEmail = `e2e-validate-${crypto.randomUUID()}@test.com`;
  const testUsers: string[] = [];

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
    accessToken = testUser.accessToken;
    testUsers.push(testUser.userId);
  });

  afterAll(async () => {
    await surgicalCleanup(prisma, testUsers);
    await app.close();
  });

  it('Deve validar um access token ativo e retornar o payload', async () => {
    const response = await request(app.getHttpServer()).post('/auth/validate-token').send({ token: accessToken }).expect(HttpStatus.OK);

    expect(response.body).toHaveProperty('sub', userId);
    expect(response.body).toHaveProperty('email', testEmail);
    expect((response.body as ValidateTokenOutputDto).sub).toBe(userId);
    expect((response.body as ValidateTokenOutputDto).email).toBe(testEmail);
  });

  it('Não deve validar um access token inválido ou expirado', async () => {
    await request(app.getHttpServer()).post('/auth/validate-token').send({ token: 'invalid-token' }).expect(HttpStatus.UNAUTHORIZED);
  });

  it('Não deve validar se nenhum token for fornecido', async () => {
    await request(app.getHttpServer()).post('/auth/validate-token').send({}).expect(HttpStatus.BAD_REQUEST);
  });
});
