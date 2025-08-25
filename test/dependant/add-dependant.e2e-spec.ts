import * as request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { DependantRelationship, Sex } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { FamilyStatus } from '@/domain/enums/family-status';

import { setupDependantApp, createRegularUser, createAdminUser, createIsolatedFamily, dependantCleanup, DependantTestUser } from './setup';

describe('(E2E) POST /dependants - Adição de Dependentes', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let affiliatedUser: DependantTestUser;
  let nonAffiliatedUser: DependantTestUser;
  let adminUser: DependantTestUser;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupDependantApp());

    // Criar usuário regular com família afiliada
    affiliatedUser = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(affiliatedUser.userId);

    // Criar usuário regular com família não afiliada
    nonAffiliatedUser = await createRegularUser(app, prisma, FamilyStatus.NOT_AFFILIATED);
    testUsers.push(nonAffiliatedUser.userId);

    // Criar usuário admin
    adminUser = await createAdminUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(adminUser.userId);
  });

  afterAll(async () => {
    // Cleanup cirúrgico
    await dependantCleanup(prisma, testUsers);
    await app.close();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('Cenários de Sucesso', () => {
    it('Deve criar dependente com dados válidos completos', async () => {
      // Arrange
      const validDependantData = {
        firstName: 'João',
        lastName: 'Silva',
        birthdate: '2012-01-15',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'joao.silva@test.com',
        phone: '11987654321',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(validDependantData);

      // Assert
      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        firstName: 'João',
        lastName: 'Silva',
        birthdate: expect.any(String),
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'joao.silva@test.com',
        phone: '11987654321',
        type: expect.any(String),
        familyId: expect.any(String),
      });

      // Verificar no banco se o dependente foi criado corretamente
      const createdDependant = await prisma.dependant.findUnique({
        where: { id: response.body.id },
      });

      expect(createdDependant).toBeDefined();
      expect(createdDependant?.family_id).toBe(affiliatedUser.familyId);
      expect(createdDependant?.first_name).toBe('João');
      expect(createdDependant?.last_name).toBe('Silva');
    });

    it('Deve criar dependente com dados mínimos (sem telefone)', async () => {
      // Arrange
      const minimalDependantData = {
        firstName: 'Maria',
        lastName: 'Santos',
        birthdate: '2014-03-20',
        relationship: DependantRelationship.DAUGHTER,
        sex: Sex.FEMALE,
        email: 'maria.santos@test.com',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(minimalDependantData);

      // Assert
      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.firstName).toBe('Maria');
      expect(response.body.lastName).toBe('Santos');
      expect(response.body.relationship).toBe(DependantRelationship.DAUGHTER);
      expect(response.body.sex).toBe(Sex.FEMALE);
      expect(response.body.phone).toBeNull();
    });

    it('Deve criar dependente com diferentes tipos de relacionamento', async () => {
      // Arrange
      const testCases = [
        { relationship: DependantRelationship.SON, firstName: 'Pedro' },
        { relationship: DependantRelationship.DAUGHTER, firstName: 'Ana' },
        { relationship: DependantRelationship.WIFE, firstName: 'Carla' },
        { relationship: DependantRelationship.HUSBAND, firstName: 'José' },
        { relationship: DependantRelationship.CHILD, firstName: 'Alex' },
        { relationship: DependantRelationship.OTHER, firstName: 'Roberto' },
      ];

      // Act & Assert
      for (const testCase of testCases) {
        const dependantData = {
          firstName: testCase.firstName,
          lastName: 'TestRelationship',
          birthdate: '2010-05-10',
          relationship: testCase.relationship,
          sex: Sex.MALE,
          email: `${testCase.firstName.toLowerCase()}.test@example.com`,
        };

        const response = await request(app.getHttpServer())
          .post('/dependants')
          .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
          .send(dependantData);

        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body.relationship).toBe(testCase.relationship);
        expect(response.body.firstName).toBe(testCase.firstName);
      }
    });
  });

  describe('Validação de Campos Obrigatórios', () => {
    it('Não deve criar dependente sem firstName', async () => {
      // Arrange
      const invalidData = {
        lastName: 'Silva',
        birthdate: '2012-01-15',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('First name must be a string.');
    });

    it('Não deve criar dependente sem lastName', async () => {
      // Arrange
      const invalidData = {
        firstName: 'João',
        birthdate: '2012-01-15',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Last name must be a string.');
    });

    it('Não deve criar dependente sem birthdate', async () => {
      // Arrange
      const invalidData = {
        firstName: 'João',
        lastName: 'Silva',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Birth date must be a valid date string.');
    });

    it('Não deve criar dependente sem relationship', async () => {
      // Arrange
      const invalidData = {
        firstName: 'João',
        lastName: 'Silva',
        birthdate: '2012-01-15',
        sex: Sex.MALE,
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Relationship must be a valid dependant relationship.');
    });

    it('Não deve criar dependente sem sex', async () => {
      // Arrange
      const invalidData = {
        firstName: 'João',
        lastName: 'Silva',
        birthdate: '2012-01-15',
        relationship: DependantRelationship.SON,
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Sex must be a valid sex value.');
    });

    it('Não deve criar dependente sem email', async () => {
      // Arrange
      const invalidData = {
        firstName: 'João',
        lastName: 'Silva',
        birthdate: '2012-01-15',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Email requerido.');
    });
  });

  describe('Validação de Formato de Dados', () => {
    it('Não deve criar dependente com firstName muito curto', async () => {
      // Arrange
      const invalidData = {
        firstName: 'A',
        lastName: 'Silva',
        birthdate: '2012-01-15',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('First name must be at least 2 characters long.');
    });

    it('Não deve criar dependente com lastName muito curto', async () => {
      // Arrange
      const invalidData = {
        firstName: 'João',
        lastName: 'S',
        birthdate: '2012-01-15',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Last name must be at least 2 characters long.');
    });

    it('Não deve criar dependente com birthdate inválida', async () => {
      // Arrange
      const invalidData = {
        firstName: 'João',
        lastName: 'Silva',
        birthdate: 'invalid-date',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Birth date must be a valid date string.');
    });

    it('Não deve criar dependente com relationship inválida', async () => {
      // Arrange
      const invalidData = {
        firstName: 'João',
        lastName: 'Silva',
        birthdate: '2012-01-15',
        relationship: 'INVALID_RELATIONSHIP',
        sex: Sex.MALE,
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Relationship must be a valid dependant relationship.');
    });

    it('Não deve criar dependente com sex inválido', async () => {
      // Arrange
      const invalidData = {
        firstName: 'João',
        lastName: 'Silva',
        birthdate: '2012-01-15',
        relationship: DependantRelationship.SON,
        sex: 'INVALID_SEX',
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Sex must be a valid sex value.');
    });
  });

  describe('Validação de Tipos de Dados', () => {
    it('Não deve criar dependente com firstName não sendo string', async () => {
      // Arrange
      const invalidData = {
        firstName: 123,
        lastName: 'Silva',
        birthdate: '2012-01-15',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('First name must be a string.');
    });

    it('Não deve criar dependente com phone não sendo string', async () => {
      // Arrange
      const invalidData = {
        firstName: 'João',
        lastName: 'Silva',
        birthdate: '2012-01-15',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'test@example.com',
        phone: 123456789,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Phone must be a string.');
    });
  });

  describe('Autorização e Autenticação', () => {
    it('Não deve criar dependente sem token de autenticação', async () => {
      // Arrange
      const validDependantData = {
        firstName: 'João',
        lastName: 'Silva',
        birthdate: '2012-01-15',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer()).post('/dependants').send(validDependantData);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('Não deve criar dependente com token inválido', async () => {
      // Arrange
      const validDependantData = {
        firstName: 'João',
        lastName: 'Silva',
        birthdate: '2012-01-15',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer()).post('/dependants').set('Authorization', 'Bearer invalid-token').send(validDependantData);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Regras de Negócio - Status da Família', () => {
    it('Não deve criar dependente para família não afiliada', async () => {
      // Arrange
      const validDependantData = {
        firstName: 'João',
        lastName: 'Silva',
        birthdate: '2012-01-15',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${nonAffiliatedUser.accessToken}`)
        .send(validDependantData);

      // Assert
      // Status específico depende da implementação da regra de negócio
      expect([HttpStatus.BAD_REQUEST, HttpStatus.FORBIDDEN, HttpStatus.UNPROCESSABLE_ENTITY]).toContain(response.status);
    });
  });

  describe('Campos Extras e Validação Rigorosa', () => {
    it('Deve rejeitar campos extras não permitidos', async () => {
      // Arrange
      const dataWithExtraFields = {
        firstName: 'João',
        lastName: 'Silva',
        birthdate: '2012-01-15',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'test@example.com',
        extraField: 'not allowed',
        anotherExtra: 123,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(dataWithExtraFields);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });
});
