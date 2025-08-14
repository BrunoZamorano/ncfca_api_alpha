import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { AppModule } from '@/app.module';
import { createTestUser } from '../utils/prisma/create-test-user';
import { UserRoles } from '@/domain/enums/user-roles';

describe('E2E ValidateToken', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let accessToken: string;
  const testEmail = `e2e-validate-${crypto.randomUUID()}@test.com`;
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
    accessToken = testUser.accessToken;
  });

  afterAll(async () => {
    await prisma.family.deleteMany({ where: { holder_id: userId } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await app.close();
  });

  it('Deve validar um access token ativo e retornar o payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/validate-token')
      .send({ token: accessToken })
      .expect(HttpStatus.OK);

    expect(response.body).toHaveProperty('sub', userId);
    expect(response.body).toHaveProperty('email', testEmail);
  });

  it('Não deve validar um access token inválido ou expirado', async () => {
    await request(app.getHttpServer())
      .post('/auth/validate-token')
      .send({ token: 'invalid-token' })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('Não deve validar se nenhum token for fornecido', async () => {
    await request(app.getHttpServer()).post('/auth/validate-token').send({}).expect(HttpStatus.BAD_REQUEST);
  });
});
