import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import AllExceptionsFilter from '@/infraestructure/filters/global-exception-filter';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { UserRoles } from '@/domain/enums/user-roles';
import { randomUUID } from 'crypto';

describe('E2E EditUserProfile', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let user: { userId: string; familyId: string; accessToken: string };
  const testUsers: string[] = [];

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
    testUsers.push(user.userId);
  });

  afterEach(async () => {
    // Apenas limpar dados específicos criados pelos testes se necessário
  });

  afterAll(async () => {
    await surgicalCleanup(prisma, testUsers);
    await app.close();
  });

  it('Deve atualizar perfil do usuário autenticado', async () => {
    // Arrange
    const updateData = {
      firstName: 'José',
      lastName: 'Santos',
      phone: '11998877665',
      email: `updated-${randomUUID()}@example.com`,
    };

    // Act
    const response = await request(app.getHttpServer()).patch('/account/profile').set('Authorization', `Bearer ${user.accessToken}`).send(updateData);

    // Assert
    expect(response.status).toBe(204);

    // Verificar se os dados foram atualizados no banco
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });
    expect(updatedUser?.first_name).toBe(updateData.firstName);
    expect(updatedUser?.last_name).toBe(updateData.lastName);
    expect(updatedUser?.phone).toBe(updateData.phone);
    expect(updatedUser?.email).toBe(updateData.email);
  });

  it('Não deve permitir atualização sem autenticação', async () => {
    // Arrange
    const updateData = {
      firstName: 'José',
      lastName: 'Santos',
    };

    // Act
    const response = await request(app.getHttpServer()).patch('/account/profile').send(updateData);

    // Assert
    expect(response.status).toBe(401);
  });

  it('Não deve atualizar perfil com dados inválidos', async () => {
    // Arrange
    const invalidData = {
      firstName: 'A', // Muito curto
      email: 'email-invalido', // Email inválido
    };

    // Act
    const response = await request(app.getHttpServer())
      .patch('/account/profile')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(invalidData);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('Deve permitir atualização de campos individuais', async () => {
    // Arrange
    const originalUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    const partialUpdateData = {
      firstName: 'NovoNome',
    };

    // Act
    const response = await request(app.getHttpServer())
      .patch('/account/profile')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(partialUpdateData);

    // Assert
    expect(response.status).toBe(204);

    // Verificar se apenas o campo especificado foi atualizado
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });
    expect(updatedUser?.first_name).toBe(partialUpdateData.firstName);
    expect(updatedUser?.last_name).toBe(originalUser?.last_name); // Não deve mudar
    expect(updatedUser?.email).toBe(originalUser?.email); // Não deve mudar
    expect(updatedUser?.phone).toBe(originalUser?.phone); // Não deve mudar
  });
});
