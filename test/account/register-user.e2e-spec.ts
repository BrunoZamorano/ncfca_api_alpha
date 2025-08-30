import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import AllExceptionsFilter from '@/infraestructure/filters/global-exception-filter';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { FamilyStatus } from '@/domain/enums/family-status';
import { randomUUID } from 'crypto';
import { CpfGenerator } from '@/infraestructure/services/cpf-generator.service';
import { surgicalCleanup } from '../utils/prisma/cleanup';

describe('E2E RegisterUser', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const testUsers: string[] = [];
  let cpfGenerator: CpfGenerator;

  const createValidUserData = () => ({
    firstName: 'João',
    lastName: 'Silva',
    email: `test-${randomUUID()}@example.com`,
    phone: '11987654321',
    cpf: cpfGenerator.gerarCpf(),
    password: 'Password@123',
    confirmPassword: 'Password@123',
    address: {
      street: 'Rua das Flores',
      number: '123',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234567',
      complement: 'Apto 45',
    },
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    prisma = app.get(PrismaService);
    cpfGenerator = new CpfGenerator();
  });

  afterAll(async () => {
    await surgicalCleanup(prisma, testUsers);
    await app.close();
  });

  it('Deve registrar usuário com sucesso e retornar tokens', async () => {
    // Arrange
    const userData = createValidUserData();

    // Act
    const response = await request(app.getHttpServer()).post('/account/user').send(userData);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(typeof response.body.accessToken).toBe('string');
    expect(typeof response.body.refreshToken).toBe('string');

    // Verificar se usuário foi criado no banco
    const createdUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    expect(createdUser).toBeTruthy();
    expect(createdUser?.first_name).toBe(userData.firstName);
    expect(createdUser?.last_name).toBe(userData.lastName);

    if (createdUser?.id) {
      testUsers.push(createdUser.id);
    }

    // Verificar se família foi criada automaticamente
    const createdFamily = await prisma.family.findUnique({
      where: { holder_id: createdUser?.id },
    });
    expect(createdFamily).toBeTruthy();
    expect(createdFamily?.status).toBe(FamilyStatus.NOT_AFFILIATED);
  });

  it('Não deve registrar usuário com email já existente', async () => {
    // Arrange
    const userData = createValidUserData();

    // Criar primeiro usuário
    const firstResponse = await request(app.getHttpServer()).post('/account/user').send(userData);

    expect(firstResponse.status).toBe(201);

    const firstUser = await prisma.user.findUnique({ where: { email: userData.email } });
    if (firstUser?.id) {
      testUsers.push(firstUser.id);
    }

    // Tentar criar segundo usuário com mesmo email
    const duplicateUserData = createValidUserData();
    duplicateUserData.email = userData.email; // Mesmo email

    // Act
    const response = await request(app.getHttpServer()).post('/account/user').send(duplicateUserData);

    // Assert
    expect(response.status).toBe(500); // O use case lança Error, não InvalidOperationException
    expect(response.body.message).toContain('O email não está disponível');
  });

  it('Não deve registrar usuário com CPF já existente', async () => {
    // Arrange
    const userData1 = createValidUserData();
    const userData2 = createValidUserData();

    // Criar primeiro usuário
    const firstResponse = await request(app.getHttpServer()).post('/account/user').send(userData1);
    expect(firstResponse.status).toBe(201);

    const firstUser = await prisma.user.findUnique({ where: { email: userData1.email } });
    if (firstUser?.id) {
      testUsers.push(firstUser.id);
    }

    // Tentar criar segundo usuário com mesmo CPF
    const duplicateUserData = {
      ...userData2,
      cpf: userData1.cpf,
    };

    // Act
    const response = await request(app.getHttpServer()).post('/account/user').send(duplicateUserData);

    // Assert
    expect(response.status).toBe(500);
    expect(response.body.message).toContain('Unique constraint failed on the fields: (`cpf`)');
  });

  it('Não deve registrar usuário com dados inválidos', async () => {
    // Arrange
    const invalidUserData = {
      firstName: 'A', // Muito curto
      lastName: '', // Vazio
      email: 'email-invalido', // Email inválido
      phone: '123', // Telefone muito curto
      cpf: '123', // CPF inválido
      password: '123', // Senha muito fraca
      confirmPassword: '456', // Confirmação diferente
      address: {
        street: '',
        number: '',
        district: '',
        city: '',
        state: '',
        zipCode: '',
        complement: '',
      },
    };

    // Act
    const response = await request(app.getHttpServer()).post('/account/user').send(invalidUserData);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('Não deve registrar usuário com senhas diferentes', async () => {
    // Arrange
    const userData = createValidUserData();
    userData.confirmPassword = 'DifferentPassword@123';

    // Act
    const response = await request(app.getHttpServer()).post('/account/user').send(userData);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(expect.arrayContaining([expect.stringContaining('As senhas não coincidem')]));
  });
});
