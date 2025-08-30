import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { TrainingListItemView } from '@/application/queries/training-query/training-list-item.view';

import {
  setupTrainingApp,
  createAdminUser,
  createClubOwnerUser,
  createRegularUser,
  createTestTraining,
  trainingCleanup,
  TrainingTestUser,
} from './setup';

describe('(E2E) ListTrainings', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let adminUser: TrainingTestUser;
  let clubOwnerUser: TrainingTestUser;
  let regularUser: TrainingTestUser;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupTrainingApp());

    // Criar usuário admin
    adminUser = await createAdminUser(app, prisma);
    testUsers.push(adminUser.userId);

    // Criar usuário dono de clube
    clubOwnerUser = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwnerUser.userId);

    // Criar usuário regular
    regularUser = await createRegularUser(app, prisma);
    testUsers.push(regularUser.userId);

    // Criar alguns treinamentos para os testes
    await createTestTraining(prisma, {
      title: 'Treinamento 1',
      description: 'Descrição do treinamento 1',
      youtubeUrl: 'https://youtube.com/watch?v=test1',
    });

    await createTestTraining(prisma, {
      title: 'Treinamento 2',
      description: 'Descrição do treinamento 2',
      youtubeUrl: 'https://youtube.com/watch?v=test2',
    });
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await trainingCleanup(prisma, testUsers);
    await app.close();
  });

  describe('GET /trainings', () => {
    it('Deve permitir que usuário ADMIN liste todos os treinamentos', async () => {
      // Arrange - Dados já preparados no beforeAll

      // Act - Fazer requisição como ADMIN
      const response = await request(app.getHttpServer())
        .get('/trainings')
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Validar estrutura da resposta
      const trainings = response.body as TrainingListItemView[];
      expect(Array.isArray(trainings)).toBe(true);
      expect(trainings.length).toBeGreaterThanOrEqual(2);

      // Verificar que cada treinamento tem os campos obrigatórios
      trainings.forEach((training: TrainingListItemView) => {
        expect(training).toHaveProperty('id');
        expect(training).toHaveProperty('title');
        expect(training).toHaveProperty('description');
        expect(training).toHaveProperty('youtubeUrl');
        expect(typeof training.id).toBe('string');
        expect(typeof training.title).toBe('string');
        expect(typeof training.description).toBe('string');
        expect(typeof training.youtubeUrl).toBe('string');
      });
    });

    it('Deve permitir que usuário DONO_DE_CLUBE liste todos os treinamentos', async () => {
      // Arrange - Dados já preparados no beforeAll

      // Act - Fazer requisição como DONO_DE_CLUBE
      const response = await request(app.getHttpServer())
        .get('/trainings')
        .set('Authorization', `Bearer ${clubOwnerUser.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Validar estrutura da resposta
      const trainings = response.body as TrainingListItemView[];
      expect(Array.isArray(trainings)).toBe(true);
      expect(trainings.length).toBeGreaterThanOrEqual(2);

      // Verificar que cada treinamento tem os campos obrigatórios
      trainings.forEach((training: TrainingListItemView) => {
        expect(training).toHaveProperty('id');
        expect(training).toHaveProperty('title');
        expect(training).toHaveProperty('description');
        expect(training).toHaveProperty('youtubeUrl');
        expect(typeof training.id).toBe('string');
        expect(typeof training.title).toBe('string');
        expect(typeof training.description).toBe('string');
        expect(typeof training.youtubeUrl).toBe('string');
      });
    });

    it('Não deve permitir que usuário SEM_FUNCAO liste treinamentos', async () => {
      // Arrange - Dados já preparados no beforeAll

      // Act & Assert - Deve retornar 403 FORBIDDEN
      await request(app.getHttpServer()).get('/trainings').set('Authorization', `Bearer ${regularUser.accessToken}`).expect(HttpStatus.FORBIDDEN);
    });

    it('Não deve permitir acesso sem token de autenticação', async () => {
      // Arrange - Nenhuma preparação especial

      // Act & Assert - Tentar acessar sem token
      await request(app.getHttpServer()).get('/trainings').expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
