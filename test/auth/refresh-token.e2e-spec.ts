import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { AppModule } from '@/app.module';
import { createTestUser } from '../utils/prisma/create-test-user';
import { UserRoles } from '@/domain/enums/user-roles';

describe('E2E RefreshToken', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let refreshToken: string;
  const testEmail = `e2e-refresh-${crypto.randomUUID()}@test.com`;
  const testPassword = 'Password@123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = app.get(PrismaService);
    await createTestUser(testEmail, [UserRoles.SEM_FUNCAO], prisma, app);

    // Login to get a valid refresh token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });
    
    refreshToken = loginResponse.body.refreshToken;
    const userInDb = await prisma.user.findUnique({ where: { email: testEmail } });
    userId = userInDb!.id;
  });

  afterAll(async () => {
    await prisma.family.deleteMany({ where: { holder_id: userId } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await app.close();
  });

  it('Deve gerar um novo par de tokens com um refresh token válido', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .send({ token: refreshToken })
      .expect(HttpStatus.OK);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.refreshToken).not.toBe(refreshToken);
  });

  it('Não deve gerar tokens com um refresh token inválido ou expirado', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .send({ token: 'invalid-token' })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('Não deve gerar tokens se nenhum token for fornecido', async () => {
    await request(app.getHttpServer()).post('/auth/refresh-token').send({}).expect(HttpStatus.BAD_REQUEST);
  });
});
