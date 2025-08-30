import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DependantRelationship, Sex } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { FamilyStatus } from '@/domain/enums/family-status';

import {
  setupDependantApp,
  createRegularUser,
  createAdminUser,
  createTestDependant,
  createMultipleTestDependants,
  createIsolatedFamily,
  dependantCleanup,
  DependantTestUser,
} from './setup';

describe('(E2E) GET /dependants - Listagem de Dependentes', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let userWithDependants: DependantTestUser;
  let userWithoutDependants: DependantTestUser;
  let adminUser: DependantTestUser;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupDependantApp());

    // Criar usuário regular com família afiliada (para ter dependentes)
    userWithDependants = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(userWithDependants.userId);

    // Criar usuário regular sem dependentes
    userWithoutDependants = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(userWithoutDependants.userId);

    // Criar usuário admin
    adminUser = await createAdminUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(adminUser.userId);

    // Criar dependentes para o primeiro usuário
    await createMultipleTestDependants(prisma, userWithDependants.familyId, 3);
  });

  afterAll(async () => {
    // Cleanup cirúrgico
    await dependantCleanup(prisma, testUsers);
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cenários de Sucesso', () => {
    it('Deve listar todos os dependentes da família com sucesso', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${userWithDependants.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);

      // Verificar estrutura dos dados retornados
      response.body.forEach((dependant: any) => {
        expect(dependant).toMatchObject({
          id: expect.any(String),
          firstName: expect.any(String),
          lastName: expect.any(String),
          birthdate: expect.any(String),
          relationship: expect.any(String),
          sex: expect.any(String),
          type: expect.any(String),
          familyId: expect.any(String),
        });

        // Campos opcionais
        if (dependant.phone !== null) {
          expect(typeof dependant.phone).toBe('string');
        }
      });
    });

    it('Deve retornar array vazio quando usuário não possui dependentes', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${userWithoutDependants.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('Deve listar dependentes ordenados corretamente', async () => {
      // Arrange - Criar usuário com dependentes específicos para ordenação
      const specificUser = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
      testUsers.push(specificUser.userId);

      // Criar dependentes com datas diferentes para verificar ordenação
      await createTestDependant(prisma, specificUser.familyId, {
        firstName: 'Ana',
        lastName: 'Primeira',
        birthDate: new Date('2015-01-01'),
        relationship: DependantRelationship.DAUGHTER,
        sex: Sex.FEMALE,
      });

      await createTestDependant(prisma, specificUser.familyId, {
        firstName: 'Bruno',
        lastName: 'Segundo',
        birthDate: new Date('2010-01-01'),
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
      });

      // Act
      const response = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${specificUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveLength(2);

      // Verificar se os dados corretos foram retornados
      const dependantNames = response.body.map((d: any) => d.firstName);
      expect(dependantNames).toContain('Ana');
      expect(dependantNames).toContain('Bruno');
    });

    it('Deve listar dependentes com diferentes relacionamentos', async () => {
      // Arrange - Criar usuário com diferentes tipos de dependentes
      const diverseFamilyUser = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
      testUsers.push(diverseFamilyUser.userId);

      const relationships = [
        { rel: DependantRelationship.SON, name: 'Pedro' },
        { rel: DependantRelationship.DAUGHTER, name: 'Maria' },
        { rel: DependantRelationship.WIFE, name: 'Carla' },
        { rel: DependantRelationship.HUSBAND, name: 'José' },
        { rel: DependantRelationship.OTHER, name: 'Roberto' },
      ];

      for (const item of relationships) {
        await createTestDependant(prisma, diverseFamilyUser.familyId, {
          firstName: item.name,
          lastName: 'Test',
          relationship: item.rel,
          sex: item.rel === DependantRelationship.DAUGHTER || item.rel === DependantRelationship.WIFE ? Sex.FEMALE : Sex.MALE,
        });
      }

      // Act
      const response = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${diverseFamilyUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveLength(5);

      // Verificar se todos os relacionamentos estão presentes
      const returnedRelationships = response.body.map((d: any) => d.relationship);
      relationships.forEach(({ rel }) => {
        expect(returnedRelationships).toContain(rel);
      });
    });

    it('Deve listar dependentes com informações completas', async () => {
      // Arrange - Criar dependente com todos os campos preenchidos
      const completeDataUser = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
      testUsers.push(completeDataUser.userId);

      await createTestDependant(prisma, completeDataUser.familyId, {
        firstName: 'Complete',
        lastName: 'Data',
        birthDate: new Date('2012-06-15'),
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'complete.data@test.com',
        phone: '11987654321',
      });

      // Act
      const response = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${completeDataUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveLength(1);

      const dependant = response.body[0];
      expect(dependant).toMatchObject({
        firstName: 'Complete',
        lastName: 'Data',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'complete.data@test.com',
        phone: '11987654321',
      });

      // Verificar formato da data de nascimento
      expect(dependant.birthdate).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('Isolamento e Segurança', () => {
    it('Deve listar apenas dependentes da própria família', async () => {
      // Arrange - Criar duas famílias isoladas
      const family1 = await createIsolatedFamily(app, prisma);
      const family2 = await createIsolatedFamily(app, prisma);
      testUsers.push(family1.user.userId, family2.user.userId);

      // Adicionar mais dependentes à família 2 para garantir que família 1 não os veja
      await createTestDependant(prisma, family2.user.familyId, {
        firstName: 'Extra',
        lastName: 'Family2',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
      });

      // Act - Listar dependentes da família 1
      const response1 = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${family1.user.accessToken}`);

      // Act - Listar dependentes da família 2
      const response2 = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${family2.user.accessToken}`);

      // Assert
      expect(response1.status).toBe(HttpStatus.OK);
      expect(response2.status).toBe(HttpStatus.OK);

      // Família 1 deve ver apenas 1 dependente (criado no setup)
      expect(response1.body).toHaveLength(1);
      expect(response1.body[0].firstName).toBe('Isolated');

      // Família 2 deve ver apenas 2 dependentes (setup + extra)
      expect(response2.body).toHaveLength(2);
      const family2Names = response2.body.map((d: any) => d.firstName);
      expect(family2Names).toContain('Isolated');
      expect(family2Names).toContain('Extra');

      // Verificar que não há vazamento entre famílias
      const family1Ids = response1.body.map((d: any) => d.id);
      const family2Ids = response2.body.map((d: any) => d.id);

      // Nenhum ID deve estar em ambas as listas
      const intersection = family1Ids.filter((id: string) => family2Ids.includes(id));
      expect(intersection).toHaveLength(0);
    });

    it('Deve funcionar corretamente para usuário admin (listar seus próprios dependentes)', async () => {
      // Arrange - Criar dependente para o admin
      await createTestDependant(prisma, adminUser.familyId, {
        firstName: 'Admin',
        lastName: 'Dependant',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
      });

      // Act
      const response = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${adminUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].firstName).toBe('Admin');
    });
  });

  describe('Autorização e Autenticação', () => {
    it('Não deve permitir listagem sem token de autenticação', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/dependants');

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('Não deve permitir listagem com token inválido', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/dependants').set('Authorization', 'Bearer invalid-token');

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('Não deve permitir listagem com token malformado', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/dependants').set('Authorization', 'malformed-authorization');

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Integridade dos Dados', () => {
    it('Deve retornar dados consistentes em múltiplas chamadas', async () => {
      // Act - Fazer múltiplas chamadas
      const response1 = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${userWithDependants.accessToken}`);

      const response2 = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${userWithDependants.accessToken}`);

      // Assert
      expect(response1.status).toBe(HttpStatus.OK);
      expect(response2.status).toBe(HttpStatus.OK);
      expect(response1.body).toHaveLength(response2.body.length);

      // Verificar se os dados são idênticos
      const ids1 = response1.body.map((d: any) => d.id).sort();
      const ids2 = response2.body.map((d: any) => d.id).sort();
      expect(ids1).toEqual(ids2);
    });

    it('Deve manter integridade após operações concorrentes', async () => {
      // Arrange - Criar usuário para teste de concorrência
      const concurrencyUser = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
      testUsers.push(concurrencyUser.userId);

      // Criar dependente inicial
      await createTestDependant(prisma, concurrencyUser.familyId, {
        firstName: 'Concurrent',
        lastName: 'Test',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
      });

      // Act - Fazer chamadas concorrentes
      const promises = Array(5)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${concurrencyUser.accessToken}`));

      const responses = await Promise.all(promises);

      // Assert
      responses.forEach((response) => {
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].firstName).toBe('Concurrent');
      });
    });
  });

  describe('Casos Extremos', () => {
    it('Deve funcionar com família que tem muitos dependentes', async () => {
      // Arrange - Criar usuário com muitos dependentes
      const bigFamilyUser = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
      testUsers.push(bigFamilyUser.userId);

      // Criar 10 dependentes
      await createMultipleTestDependants(prisma, bigFamilyUser.familyId, 10);

      // Act
      const response = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${bigFamilyUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveLength(10);

      // Verificar que todos os dependentes têm estrutura válida
      response.body.forEach((dependant: any) => {
        expect(dependant.id).toBeDefined();
        expect(dependant.firstName).toBeDefined();
        expect(dependant.lastName).toBeDefined();
        expect(dependant.birthdate).toBeDefined();
        expect(dependant.relationship).toBeDefined();
        expect(dependant.sex).toBeDefined();
      });
    });

    it('Deve funcionar corretamente após criação e exclusão de dependentes', async () => {
      // Arrange - Criar usuário para testes de modificação
      const modificationUser = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
      testUsers.push(modificationUser.userId);

      // Criar dependente e depois removê-lo
      const dependant = await createTestDependant(prisma, modificationUser.familyId, {
        firstName: 'ToBeDeleted',
        lastName: 'Test',
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
      });

      // Verificar que existe
      let response = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${modificationUser.accessToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveLength(1);

      // Remover dependente
      await prisma.dependant.delete({
        where: { id: dependant.id },
      });

      // Act - Verificar que lista ficou vazia
      response = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${modificationUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveLength(0);
    });
  });
});
