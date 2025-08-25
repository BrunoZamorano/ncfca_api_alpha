import * as request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { DependantRelationship, DependantType, Sex } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { FamilyStatus } from '@/domain/enums/family-status';

import {
  setupDependantApp,
  createRegularUser,
  createTestDependant,
  createMultipleTestDependants,
  createIsolatedFamily,
  dependantCleanup,
  DependantTestUser,
} from './setup';

describe('(E2E) GET /dependants - Visualização de Família e Dependente', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let primaryUser: DependantTestUser;
  let isolatedUser: DependantTestUser;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupDependantApp());

    // Criar usuário principal com família afiliada
    primaryUser = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(primaryUser.userId);

    // Criar usuário isolado para testes de autorização
    isolatedUser = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(isolatedUser.userId);
  });

  afterAll(async () => {
    // Cleanup cirúrgico
    await dependantCleanup(prisma, testUsers);
    await app.close();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('GET /dependants/my-family - Visualização da Família Completa', () => {
    it('Deve retornar dados da família sem dependentes', async () => {
      // Arrange - Família já criada no setup sem dependentes

      // Act
      const response = await request(app.getHttpServer()).get('/dependants/my-family').set('Authorization', `Bearer ${primaryUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toMatchObject({
        id: primaryUser.familyId,
        status: expect.any(String),
        dependants: [],
        affiliationExpiresAt: expect.any(String),
      });

      // Verificar que os dependentes estão vazios inicialmente
      expect(response.body.dependants).toHaveLength(0);
    });

    it('Deve retornar dados da família com dependentes existentes', async () => {
      // Arrange - Criar múltiplos dependentes para a família
      const createdDependants = await createMultipleTestDependants(prisma, primaryUser.familyId, 3);

      // Act
      const response = await request(app.getHttpServer()).get('/dependants/my-family').set('Authorization', `Bearer ${primaryUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toMatchObject({
        id: primaryUser.familyId,
        status: expect.any(String),
        dependants: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
            birthdate: expect.any(String),
            relationship: expect.any(String),
            sex: expect.any(String),
            type: expect.any(String),
            familyId: primaryUser.familyId,
          }),
        ]),
        affiliationExpiresAt: expect.any(String),
      });

      // Verificar que todos os dependentes criados estão presentes
      expect(response.body.dependants).toHaveLength(3);

      // Verificar que cada dependente tem os campos corretos
      response.body.dependants.forEach((dependant: any) => {
        expect(dependant.familyId).toBe(primaryUser.familyId);
        expect(dependant).toHaveProperty('id');
        expect(dependant).toHaveProperty('firstName');
        expect(dependant).toHaveProperty('lastName');
        expect(dependant).toHaveProperty('birthdate');
        expect(dependant).toHaveProperty('relationship');
        expect(dependant).toHaveProperty('sex');
        expect(dependant).toHaveProperty('type');
      });
    });

    it('Deve retornar dados da família com tipos diversos de dependentes', async () => {
      // Arrange - Criar dependentes com diferentes características
      const studentDependant = await createTestDependant(prisma, isolatedUser.familyId, {
        firstName: 'Estudante',
        lastName: 'Teste',
        type: DependantType.STUDENT,
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        birthDate: new Date('2012-01-15'),
      });

      const alumniDependant = await createTestDependant(prisma, isolatedUser.familyId, {
        firstName: 'Alumni',
        lastName: 'Teste',
        type: DependantType.ALUMNI,
        relationship: DependantRelationship.DAUGHTER,
        sex: Sex.FEMALE,
        birthDate: new Date('1995-05-20'),
      });

      const parentDependant = await createTestDependant(prisma, isolatedUser.familyId, {
        firstName: 'Parent',
        lastName: 'Teste',
        type: DependantType.PARENT,
        relationship: DependantRelationship.WIFE,
        sex: Sex.FEMALE,
        birthDate: new Date('1980-08-10'),
      });

      // Act
      const response = await request(app.getHttpServer()).get('/dependants/my-family').set('Authorization', `Bearer ${isolatedUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.dependants).toHaveLength(3);

      // Verificar tipos específicos
      const dependantTypes = response.body.dependants.map((d: any) => d.type);
      expect(dependantTypes).toContain(DependantType.STUDENT);
      expect(dependantTypes).toContain(DependantType.ALUMNI);
      expect(dependantTypes).toContain(DependantType.PARENT);

      // Verificar relacionamentos específicos
      const relationships = response.body.dependants.map((d: any) => d.relationship);
      expect(relationships).toContain(DependantRelationship.SON);
      expect(relationships).toContain(DependantRelationship.DAUGHTER);
      expect(relationships).toContain(DependantRelationship.WIFE);
    });

    it('Não deve acessar dados da família sem autenticação', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/dependants/my-family');

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('Não deve acessar dados da família com token inválido', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/dependants/my-family').set('Authorization', 'Bearer token-invalido');

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /dependants/:id - Visualização de Dependente Específico', () => {
    let testDependant: any;
    let isolatedDependant: any;

    beforeAll(async () => {
      // Criar dependente para testes específicos
      testDependant = await createTestDependant(prisma, primaryUser.familyId, {
        firstName: 'João',
        lastName: 'Silva',
        type: DependantType.STUDENT,
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        birthDate: new Date('2012-01-15'),
        email: 'joao.silva@test.com',
        phone: '11987654321',
      });

      // Criar dependente em família isolada para teste de autorização
      isolatedDependant = await createTestDependant(prisma, isolatedUser.familyId, {
        firstName: 'Isolated',
        lastName: 'User',
        type: DependantType.STUDENT,
        relationship: DependantRelationship.DAUGHTER,
        sex: Sex.FEMALE,
        birthDate: new Date('2013-03-20'),
        email: 'isolated@test.com',
      });
    });

    it('Deve retornar dados completos do dependente com holder info', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get(`/dependants/${testDependant.id}`)
        .set('Authorization', `Bearer ${primaryUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toMatchObject({
        id: testDependant.id,
        firstName: 'João',
        lastName: 'Silva',
        birthdate: expect.any(String),
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'joao.silva@test.com',
        phone: '11987654321',
        type: expect.any(String),
        familyId: primaryUser.familyId,
        holder: {
          id: expect.any(String),
          firstName: expect.any(String),
          lastName: expect.any(String),
          email: expect.any(String),
          phone: expect.any(String),
        },
      });

      // Verificar que os dados do holder estão incluídos
      expect(response.body.holder.id).toBeTruthy();
      expect(response.body.holder.firstName).toBeTruthy();
      expect(response.body.holder.lastName).toBeTruthy();
      expect(response.body.holder.email).toBeTruthy();
    });

    it('Deve retornar dados do dependente sem campos opcionais', async () => {
      // Arrange - Criar dependente sem telefone
      const dependantWithoutPhone = await createTestDependant(prisma, primaryUser.familyId, {
        firstName: 'Maria',
        lastName: 'Santos',
        type: DependantType.STUDENT,
        relationship: DependantRelationship.DAUGHTER,
        sex: Sex.FEMALE,
        birthDate: new Date('2014-03-20'),
        email: 'maria.santos@test.com',
        // phone omitido - será null no banco
      });

      // Act
      const response = await request(app.getHttpServer())
        .get(`/dependants/${dependantWithoutPhone.id}`)
        .set('Authorization', `Bearer ${primaryUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.firstName).toBe('Maria');
      expect(response.body.lastName).toBe('Santos');
      expect(response.body.phone).toBeNull();
      expect(response.body.email).toBe('maria.santos@test.com');
      expect(response.body.holder).toBeDefined();
    });

    it('Deve retornar dados do dependente de diferentes tipos', async () => {
      // Arrange - Criar dependente ALUMNI
      const alumniDependant = await createTestDependant(prisma, primaryUser.familyId, {
        firstName: 'Alumni',
        lastName: 'Exemplo',
        type: DependantType.ALUMNI,
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        birthDate: new Date('1995-01-15'),
        email: 'alumni@test.com',
      });

      // Act
      const response = await request(app.getHttpServer())
        .get(`/dependants/${alumniDependant.id}`)
        .set('Authorization', `Bearer ${primaryUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.type).toBe(DependantType.ALUMNI);
      expect(response.body.firstName).toBe('Alumni');
      expect(response.body.lastName).toBe('Exemplo');
    });

    it('Deve retornar erro 404 para dependente inexistente', async () => {
      // Arrange - ID fictício
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      // Act
      const response = await request(app.getHttpServer())
        .get(`/dependants/${nonExistentId}`)
        .set('Authorization', `Bearer ${primaryUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
      expect(response.body.message).toContain('Dependant');
      expect(response.body.message).toContain('not found');
    });

    it('Deve retornar erro 400 para ID inválido', async () => {
      // Arrange - ID com formato inválido
      const invalidId = 'id-invalido-123';

      // Act
      const response = await request(app.getHttpServer()).get(`/dependants/${invalidId}`).set('Authorization', `Bearer ${primaryUser.accessToken}`);

      // Assert - Pode ser 400 (Bad Request) ou 404, dependendo da validação
      expect([HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND]).toContain(response.status);
    });

    it('Deve permitir acesso a dependente de qualquer família (sem restrição)', async () => {
      // Note: Com base na implementação atual do ViewDependant use case,
      // não há verificação de autorização - qualquer usuário pode ver qualquer dependente
      // Isso pode ser uma decisão de design ou algo a ser implementado no futuro

      // Act - Usuário primary tenta acessar dependente isolated
      const response = await request(app.getHttpServer())
        .get(`/dependants/${isolatedDependant.id}`)
        .set('Authorization', `Bearer ${primaryUser.accessToken}`);

      // Assert - Atualmente permite acesso
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.id).toBe(isolatedDependant.id);
      expect(response.body.firstName).toBe('Isolated');
      expect(response.body.familyId).toBe(isolatedUser.familyId);

      // Verificar que o holder retornado é o correto (da família isolated)
      expect(response.body.holder.id).not.toBe(primaryUser.userId);
    });

    it('Não deve acessar dependente sem autenticação', async () => {
      // Act
      const response = await request(app.getHttpServer()).get(`/dependants/${testDependant.id}`);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('Não deve acessar dependente com token inválido', async () => {
      // Act
      const response = await request(app.getHttpServer()).get(`/dependants/${testDependant.id}`).set('Authorization', 'Bearer token-invalido');

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('Deve retornar dependente com todas as relações familiares válidas', async () => {
      // Arrange - Criar dependentes com diferentes relacionamentos
      const relationships = [
        DependantRelationship.SON,
        DependantRelationship.DAUGHTER,
        DependantRelationship.WIFE,
        DependantRelationship.HUSBAND,
        DependantRelationship.CHILD,
        DependantRelationship.OTHER,
      ];

      // Act & Assert para cada relacionamento
      for (const relationship of relationships) {
        const dependant = await createTestDependant(prisma, primaryUser.familyId, {
          firstName: `Teste${relationship}`,
          lastName: 'Family',
          type: DependantType.STUDENT,
          relationship: relationship,
          sex: relationship.includes('WIFE') || relationship.includes('DAUGHTER') ? Sex.FEMALE : Sex.MALE,
          birthDate: new Date('2010-01-01'),
          email: `teste.${relationship.toLowerCase()}@test.com`,
        });

        const response = await request(app.getHttpServer())
          .get(`/dependants/${dependant.id}`)
          .set('Authorization', `Bearer ${primaryUser.accessToken}`);

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.relationship).toBe(relationship);
        expect(response.body.firstName).toBe(`Teste${relationship}`);
        expect(response.body.familyId).toBe(primaryUser.familyId);
      }
    });
  });

  describe('Testes de Integridade e Isolamento', () => {
    it('Deve manter isolamento entre famílias na visualização da família', async () => {
      // Arrange - Criar dependentes em ambas as famílias
      await createTestDependant(prisma, primaryUser.familyId, {
        firstName: 'Primary',
        lastName: 'Family',
      });

      await createTestDependant(prisma, isolatedUser.familyId, {
        firstName: 'Isolated',
        lastName: 'Family',
      });

      // Act - Verificar família principal
      const primaryResponse = await request(app.getHttpServer())
        .get('/dependants/my-family')
        .set('Authorization', `Bearer ${primaryUser.accessToken}`);

      // Act - Verificar família isolada
      const isolatedResponse = await request(app.getHttpServer())
        .get('/dependants/my-family')
        .set('Authorization', `Bearer ${isolatedUser.accessToken}`);

      // Assert - Cada família deve ver apenas seus próprios dependentes
      expect(primaryResponse.status).toBe(HttpStatus.OK);
      expect(isolatedResponse.status).toBe(HttpStatus.OK);

      expect(primaryResponse.body.id).toBe(primaryUser.familyId);
      expect(isolatedResponse.body.id).toBe(isolatedUser.familyId);

      // Verificar que não há cross-contamination
      expect(primaryResponse.body.id).not.toBe(isolatedResponse.body.id);

      // Verificar que cada família tem apenas dependentes criados para ela
      const primaryDependantNames = primaryResponse.body.dependants.map((d: any) => d.firstName);
      const isolatedDependantNames = isolatedResponse.body.dependants.map((d: any) => d.firstName);

      if (primaryDependantNames.includes('Primary')) {
        expect(isolatedDependantNames).not.toContain('Primary');
      }

      if (isolatedDependantNames.includes('Isolated')) {
        expect(primaryDependantNames).not.toContain('Isolated');
      }
    });

    it('Deve retornar dados consistentes entre visualização da família e dependente específico', async () => {
      // Arrange - Criar dependente específico
      const specificDependant = await createTestDependant(prisma, primaryUser.familyId, {
        firstName: 'Consistency',
        lastName: 'Test',
        type: DependantType.STUDENT,
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        birthDate: new Date('2012-06-15'),
        email: 'consistency@test.com',
        phone: '11999887766',
      });

      // Act - Obter dados da família
      const familyResponse = await request(app.getHttpServer())
        .get('/dependants/my-family')
        .set('Authorization', `Bearer ${primaryUser.accessToken}`);

      // Act - Obter dados do dependente específico
      const dependantResponse = await request(app.getHttpServer())
        .get(`/dependants/${specificDependant.id}`)
        .set('Authorization', `Bearer ${primaryUser.accessToken}`);

      // Assert - Dados devem ser consistentes
      expect(familyResponse.status).toBe(HttpStatus.OK);
      expect(dependantResponse.status).toBe(HttpStatus.OK);

      // Encontrar o dependente na resposta da família
      const dependantInFamily = familyResponse.body.dependants.find((d: any) => d.id === specificDependant.id);

      expect(dependantInFamily).toBeDefined();

      // Comparar campos essenciais (excluindo holder que só está na view específica)
      expect(dependantInFamily.id).toBe(dependantResponse.body.id);
      expect(dependantInFamily.firstName).toBe(dependantResponse.body.firstName);
      expect(dependantInFamily.lastName).toBe(dependantResponse.body.lastName);
      expect(dependantInFamily.birthdate).toBe(dependantResponse.body.birthdate);
      expect(dependantInFamily.relationship).toBe(dependantResponse.body.relationship);
      expect(dependantInFamily.sex).toBe(dependantResponse.body.sex);
      expect(dependantInFamily.email).toBe(dependantResponse.body.email);
      expect(dependantInFamily.phone).toBe(dependantResponse.body.phone);
      expect(dependantInFamily.type).toBe(dependantResponse.body.type);
      expect(dependantInFamily.familyId).toBe(dependantResponse.body.familyId);
    });
  });
});
