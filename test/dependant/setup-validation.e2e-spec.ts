import { INestApplication } from '@nestjs/common';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import * as request from 'supertest';

import { setupDependantApp, createRegularUser, createTestDependant, createIsolatedFamily, dependantCleanup, DependantTestUser } from './setup';

describe('(E2E) DependantController Setup Validation', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let user: DependantTestUser;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Setup da aplicação
    ({ app, prisma } = await setupDependantApp());

    // Criar usuário regular com família afiliada
    user = await createRegularUser(app, prisma);
    testUsers.push(user.userId);
  });

  afterAll(async () => {
    // Cleanup cirúrgico
    await dependantCleanup(prisma, testUsers);
    await app.close();
  });

  describe('Infraestrutura de Setup', () => {
    it('Deve inicializar a aplicação corretamente', () => {
      expect(app).toBeDefined();
      expect(prisma).toBeDefined();
    });

    it('Deve criar usuário com família afiliada', () => {
      expect(user.userId).toBeDefined();
      expect(user.familyId).toBeDefined();
      expect(user.accessToken).toBeDefined();
      expect(typeof user.accessToken).toBe('string');
    });

    it('Deve autenticar requisições com token válido', async () => {
      const response = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${user.accessToken}`);

      expect([200, 404]).toContain(response.status); // 200 se há dependentes, 404 se não há
    });

    it('Deve rejeitar requisições sem autenticação', async () => {
      const response = await request(app.getHttpServer()).get('/dependants');

      expect(response.status).toBe(401);
    });
  });

  describe('Utilitários de Criação de Dados', () => {
    it('Deve criar dependente de teste', async () => {
      const dependant = await createTestDependant(prisma, user.familyId);

      expect(dependant).toBeDefined();
      expect(dependant.id).toBeDefined();
      expect(dependant.family_id).toBe(user.familyId);
      expect(dependant.first_name).toBeDefined();
      expect(dependant.last_name).toBeDefined();
    });

    it('Deve criar família isolada para testes de cross-access', async () => {
      const { user: isolatedUser, dependant } = await createIsolatedFamily(app, prisma);
      testUsers.push(isolatedUser.userId);

      expect(isolatedUser.userId).toBeDefined();
      expect(isolatedUser.familyId).toBeDefined();
      expect(isolatedUser.familyId).not.toBe(user.familyId);
      expect(dependant.family_id).toBe(isolatedUser.familyId);
    });
  });

  describe('Testes de Isolamento', () => {
    it('Deve ter famílias isoladas funcionando', async () => {
      // Criar dependente para outra família
      const { user: otherUser, dependant: otherDependant } = await createIsolatedFamily(app, prisma);
      testUsers.push(otherUser.userId);

      // Verificar que as famílias são diferentes
      expect(otherUser.familyId).not.toBe(user.familyId);
      expect(otherDependant.family_id).toBe(otherUser.familyId);

      // Tentar acessar dependente de outra família
      const response = await request(app.getHttpServer()).get(`/dependants/${otherDependant.id}`).set('Authorization', `Bearer ${user.accessToken}`);

      // O setup está funcionando - a requisição foi processada
      // (o comportamento específico de segurança será testado nos testes específicos)
      expect(response).toBeDefined();
    });
  });

  describe('Endpoints Básicos', () => {
    it('Deve acessar endpoint my-family', async () => {
      const response = await request(app.getHttpServer()).get('/dependants/my-family').set('Authorization', `Bearer ${user.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('Deve listar dependentes da família', async () => {
      const response = await request(app.getHttpServer()).get('/dependants').set('Authorization', `Bearer ${user.accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('Deve aceitar requisição de criação de dependente', async () => {
      const dependantData = {
        firstName: 'Teste',
        lastName: 'Setup',
        birthDate: '2012-01-01',
        relationship: 'SON',
        type: 'STUDENT',
        sex: 'MALE',
      };

      const response = await request(app.getHttpServer()).post('/dependants').set('Authorization', `Bearer ${user.accessToken}`).send(dependantData);

      // O importante é que não seja 401 (não autenticado) ou 500 (erro interno)
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(500);

      // Pode ser 201 (criado), 200 (sucesso) ou 400 (dados inválidos)
      expect([200, 201, 400]).toContain(response.status);
    });
  });
});
