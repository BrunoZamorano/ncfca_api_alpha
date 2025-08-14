import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { AppModule } from '@/app.module';
import { createTestUser } from '../utils/prisma/create-test-user';
import { UserRoles } from '@/domain/enums/user-roles';

describe('E2E Logout', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let accessToken: string;
  const testEmail = `e2e-logout-${crypto.randomUUID()}@test.com`;
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

  it('Deve retornar 204 para um usuário autenticado', async () => {
    await request(app.getHttpServer()).post('/auth/logout').set('Authorization', `Bearer ${accessToken}`).send().expect(HttpStatus.NO_CONTENT);
  });

  it('Não deve permitir o acesso sem um token de autenticação', async () => {
    await request(app.getHttpServer()).post('/auth/logout').send().expect(HttpStatus.UNAUTHORIZED);
  });
});
