import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import AllExceptionsFilter from '@/infraestructure/filters/global-exception-filter';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { createTestUser } from '../utils/prisma/create-test-user';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { UserRoles } from '@/domain/enums/user-roles';
import { randomUUID } from 'crypto';

describe('E2E ChangeUserPassword', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let user: { userId: string; familyId: string; accessToken: string };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    prisma = app.get(PrismaService);
    
    user = await createTestUser(`test-${randomUUID()}@example.com`, [UserRoles.SEM_FUNCAO], prisma, app);
  });

  afterEach(async () => {
    // Apenas limpar dados específicos criados pelos testes se necessário
  });

  afterAll(async () => {
    // Limpar apenas os dados criados por estes testes
    await prisma.family.deleteMany({ where: { holder_id: user.userId } });
    await prisma.user.deleteMany({ where: { id: user.userId } });
    await app.close();
  });

  it('Deve alterar senha do usuário autenticado', async () => {
    // Arrange
    const testPassword = 'Password@123'; // Senha padrão do createTestUser
    const passwordData = {
      oldPassword: testPassword,
      newPassword: 'NewStrongPassword@456'
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/account/change-password')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(passwordData);

    // Assert
    expect(response.status).toBe(204);
  });

  it('Não deve permitir alteração sem autenticação', async () => {
    // Arrange
    const passwordData = {
      oldPassword: 'OldPassword@123',
      newPassword: 'NewPassword@456'
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/account/change-password')
      .send(passwordData);

    // Assert
    expect(response.status).toBe(401);
  });

  it('Não deve alterar senha com senha atual incorreta', async () => {
    // Arrange
    const passwordData = {
      oldPassword: 'WrongPassword@123', // Senha incorreta
      newPassword: 'NewPassword@456'
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/account/change-password')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(passwordData);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('Não deve aceitar nova senha que não atenda aos critérios', async () => {
    // Arrange
    const testPassword = 'Password@123'; // Senha padrão do createTestUser
    const passwordData = {
      oldPassword: testPassword,
      newPassword: 'weak' // Senha que não atende aos critérios
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/account/change-password')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(passwordData);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('Não deve permitir nova senha igual à atual', async () => {
    // Arrange
    const testPassword = 'Password@123'; // Senha padrão do createTestUser
    const passwordData = {
      oldPassword: testPassword,
      newPassword: testPassword // Mesma senha
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/account/change-password')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(passwordData);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid credentials.');
  });
});