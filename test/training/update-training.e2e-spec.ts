import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Training } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { TrainingResponseDto } from '@/application/use-cases/training/training.dto';

import {
  setupTrainingApp,
  createAdminUser,
  createClubOwnerUser,
  createRegularUser,
  createTestTraining,
  trainingCleanup,
  TrainingTestUser,
} from './setup';

describe('(E2E) UpdateTraining', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminUser: TrainingTestUser;
  let clubOwnerUser: TrainingTestUser;
  let regularUser: TrainingTestUser;
  let testTraining: Training;
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

    // Criar treinamento para os testes de atualização
    testTraining = await createTestTraining(prisma, {
      title: 'Treinamento Original',
      description: 'Descrição original do treinamento',
      youtubeUrl: 'https://youtube.com/watch?v=original',
    });
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await trainingCleanup(prisma, testUsers);
    await app.close();
  });

  describe('PUT /trainings/:id', () => {
    it('Deve permitir que usuário ADMIN atualize um treinamento existente', async () => {
      // Arrange - Dados de atualização válidos
      const updateData = {
        title: 'Treinamento Atualizado',
        description: 'Descrição atualizada do treinamento',
        youtubeUrl: 'https://youtube.com/watch?v=updated',
      };

      // Act - Fazer requisição como ADMIN
      const response = await request(app.getHttpServer())
        .put(`/trainings/${testTraining.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      // Assert - Validar estrutura da resposta
      const updatedTraining = response.body as TrainingResponseDto;
      expect(updatedTraining).toHaveProperty('id', testTraining.id);
      expect(updatedTraining).toHaveProperty('title', updateData.title);
      expect(updatedTraining).toHaveProperty('description', updateData.description);
      expect(updatedTraining).toHaveProperty('youtubeUrl', updateData.youtubeUrl);
      expect(updatedTraining).toHaveProperty('createdAt');
      expect(updatedTraining).toHaveProperty('updatedAt');
      expect(typeof updatedTraining.id).toBe('string');
      expect(typeof updatedTraining.title).toBe('string');
      expect(typeof updatedTraining.description).toBe('string');
      expect(typeof updatedTraining.youtubeUrl).toBe('string');

      // Verificar que a data de atualização é recente
      const updatedAt = new Date(updatedTraining.updatedAt);
      expect(updatedAt.getTime()).toBeGreaterThan(Date.now() - 5000); // 5 segundos atrás
    });

    it('Não deve permitir que usuário DONO_DE_CLUBE atualize treinamento', async () => {
      // Arrange - Dados de atualização válidos
      const updateData = {
        title: 'Tentativa de Atualização',
        description: 'Tentativa de descrição',
        youtubeUrl: 'https://youtube.com/watch?v=attempt',
      };

      // Act & Assert - Deve retornar 403 FORBIDDEN
      await request(app.getHttpServer())
        .put(`/trainings/${testTraining.id}`)
        .set('Authorization', `Bearer ${clubOwnerUser.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('Deve retornar 404 quando ADMIN tentar atualizar treinamento inexistente', async () => {
      // Arrange - Dados válidos mas ID inexistente
      const updateData = {
        title: 'Treinamento Inexistente',
        description: 'Descrição para treinamento inexistente',
        youtubeUrl: 'https://youtube.com/watch?v=nonexistent',
      };
      const nonExistentId = crypto.randomUUID();

      // Act & Assert - Deve retornar 404 NOT FOUND
      await request(app.getHttpServer())
        .put(`/trainings/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('Deve rejeitar atualização de ADMIN com dados inválidos', async () => {
      // Arrange - Dados inválidos (youtubeUrl malformado)
      const invalidData = {
        title: 'Treinamento com URL Inválida',
        description: 'Descrição válida',
        youtubeUrl: 'invalid-url-format',
      };

      // Act & Assert - Deve retornar 400 BAD REQUEST
      await request(app.getHttpServer())
        .put(`/trainings/${testTraining.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('Não deve permitir atualização sem token de autenticação', async () => {
      // Arrange - Dados válidos
      const updateData = {
        title: 'Tentativa sem Token',
        description: 'Tentativa de descrição sem token',
        youtubeUrl: 'https://youtube.com/watch?v=notoken',
      };

      // Act & Assert - Tentar atualizar sem token
      await request(app.getHttpServer())
        .put(`/trainings/${testTraining.id}`)
        .send(updateData)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});