import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Training } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';

import {
  setupTrainingApp,
  createAdminUser,
  createClubOwnerUser,
  createRegularUser,
  createTestTraining,
  trainingCleanup,
  TrainingTestUser,
} from './setup';

describe('(E2E) DeleteTraining', () => {
  jest.setTimeout(30000); // Increase timeout for setup
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let adminUser: TrainingTestUser;
  let clubOwnerUser: TrainingTestUser;
  let regularUser: TrainingTestUser;
  let testTrainingForAdmin: Training;
  let testTrainingForClubOwner: Training;
  let testTrainingForUnauthenticated: Training;
  const testUsers: string[] = [];
  const createdTrainingIds: string[] = [];

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

    // Criar treinamentos para os testes de deleção
    testTrainingForAdmin = await createTestTraining(prisma, {
      title: 'Treinamento para Deleção Admin',
      description: 'Será deletado pelo admin',
      youtubeUrl: 'https://youtube.com/watch?v=delete-admin',
    });
    createdTrainingIds.push(testTrainingForAdmin.id);

    testTrainingForClubOwner = await createTestTraining(prisma, {
      title: 'Treinamento para Teste Club Owner',
      description: 'Para testar falha de autorização',
      youtubeUrl: 'https://youtube.com/watch?v=delete-clubowner',
    });
    createdTrainingIds.push(testTrainingForClubOwner.id);

    testTrainingForUnauthenticated = await createTestTraining(prisma, {
      title: 'Treinamento para Teste sem Token',
      description: 'Para testar autenticação',
      youtubeUrl: 'https://youtube.com/watch?v=delete-notoken',
    });
    createdTrainingIds.push(testTrainingForUnauthenticated.id);
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await trainingCleanup(prisma, testUsers);

    // Limpar treinamentos que não foram deletados pelos testes
    // (excluindo testTrainingForAdmin que é deletado no teste de sucesso)
    const trainingsToCleanup = createdTrainingIds.filter((id) => id !== testTrainingForAdmin.id);
    if (trainingsToCleanup.length > 0) {
      await prisma.training.deleteMany({
        where: { id: { in: trainingsToCleanup } },
      });
    }

    await app.close();
  });

  describe('DELETE /trainings/:id', () => {
    it('Deve permitir que usuário ADMIN delete um treinamento existente', async () => {
      // Arrange - Treinamento já criado no beforeAll

      // Act - Fazer requisição DELETE como ADMIN
      await request(app.getHttpServer())
        .delete(`/trainings/${testTrainingForAdmin.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Assert - Verificar que o treinamento foi realmente deletado
      const deletedTraining = await prisma.training.findUnique({
        where: { id: testTrainingForAdmin.id },
      });
      expect(deletedTraining).toBeNull();
    });

    it('Não deve permitir que usuário DONO_DE_CLUBE delete treinamento', async () => {
      // Arrange - Treinamento já criado no beforeAll

      // Act & Assert - Deve retornar 403 FORBIDDEN
      await request(app.getHttpServer())
        .delete(`/trainings/${testTrainingForClubOwner.id}`)
        .set('Authorization', `Bearer ${clubOwnerUser.accessToken}`)
        .expect(HttpStatus.FORBIDDEN);

      // Assert - Verificar que o treinamento ainda existe
      const existingTraining = await prisma.training.findUnique({
        where: { id: testTrainingForClubOwner.id },
      });
      expect(existingTraining).not.toBeNull();
      expect(existingTraining?.id).toBe(testTrainingForClubOwner.id);
    });

    it('Não deve permitir que usuário SEM_FUNCAO delete treinamento', async () => {
      // Arrange - Treinamento já criado no beforeAll

      // Act & Assert - Deve retornar 403 FORBIDDEN
      await request(app.getHttpServer())
        .delete(`/trainings/${testTrainingForClubOwner.id}`)
        .set('Authorization', `Bearer ${regularUser.accessToken}`)
        .expect(HttpStatus.FORBIDDEN);

      // Assert - Verificar que o treinamento ainda existe
      const existingTraining = await prisma.training.findUnique({
        where: { id: testTrainingForClubOwner.id },
      });
      expect(existingTraining).not.toBeNull();
      expect(existingTraining?.id).toBe(testTrainingForClubOwner.id);
    });

    it('Deve retornar 404 quando ADMIN tentar deletar treinamento inexistente', async () => {
      // Arrange - ID inexistente
      const nonExistentId = crypto.randomUUID();

      // Act & Assert - Deve retornar 404 NOT FOUND
      await request(app.getHttpServer())
        .delete(`/trainings/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('Não deve permitir deleção sem token de autenticação', async () => {
      // Arrange - Treinamento já criado no beforeAll

      // Act & Assert - Tentar deletar sem token
      await request(app.getHttpServer()).delete(`/trainings/${testTrainingForUnauthenticated.id}`).expect(HttpStatus.UNAUTHORIZED);

      // Assert - Verificar que o treinamento ainda existe
      const existingTraining = await prisma.training.findUnique({
        where: { id: testTrainingForUnauthenticated.id },
      });
      expect(existingTraining).not.toBeNull();
      expect(existingTraining?.id).toBe(testTrainingForUnauthenticated.id);
    });
  });
});
