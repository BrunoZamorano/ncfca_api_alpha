import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { TrainingResponseDto } from '@/application/use-cases/training/training.dto';

import {
  setupTrainingApp,
  createAdminUser,
  createClubOwnerUser,
  createRegularUser,
  trainingCleanup,
  TrainingTestUser,
} from './setup';

describe('(E2E) CreateTraining', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminUser: TrainingTestUser;
  let clubOwnerUser: TrainingTestUser;
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
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await trainingCleanup(prisma, testUsers);
    await app.close();
  });

  describe('POST /trainings', () => {
    it('Deve permitir que usuário ADMIN crie um treinamento com dados válidos', async () => {
      // Arrange - Preparar dados válidos para criação
      const validTrainingData = {
        title: 'Treinamento E2E - Criação Teste',
        description: 'Descrição detalhada do treinamento de teste E2E',
        youtubeUrl: 'https://youtube.com/watch?v=test123456',
      };

      // Act - Fazer requisição POST como ADMIN
      const response = await request(app.getHttpServer())
        .post('/trainings')
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(validTrainingData)
        .expect(HttpStatus.CREATED);

      // Assert - Validar estrutura da resposta
      const createdTraining = response.body as TrainingResponseDto;
      expect(createdTraining).toBeDefined();
      expect(createdTraining.id).toBeDefined();
      expect(typeof createdTraining.id).toBe('string');
      expect(createdTraining.title).toBe(validTrainingData.title);
      expect(createdTraining.description).toBe(validTrainingData.description);
      expect(createdTraining.youtubeUrl).toBe(validTrainingData.youtubeUrl);
      expect(createdTraining.createdAt).toBeDefined();
      expect(createdTraining.updatedAt).toBeDefined();

      // Verificar que o treinamento foi realmente criado no banco
      const trainingInDb = await prisma.training.findUnique({
        where: { id: createdTraining.id },
      });
      expect(trainingInDb).toBeDefined();
      expect(trainingInDb?.title).toBe(validTrainingData.title);
    });

    it('Não deve permitir que usuário DONO_DE_CLUBE crie um treinamento', async () => {
      // Arrange - Preparar dados válidos para tentar criar
      const validTrainingData = {
        title: 'Tentativa de Criação por Dono de Clube',
        description: 'Descrição da tentativa de criação',
        youtubeUrl: 'https://youtube.com/watch?v=unauthorized',
      };

      // Act & Assert - Tentar fazer requisição POST como DONO_DE_CLUBE deve falhar
      await request(app.getHttpServer())
        .post('/trainings')
        .set('Authorization', `Bearer ${clubOwnerUser.accessToken}`)
        .send(validTrainingData)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('Não deve permitir que usuário ADMIN crie treinamento com dados inválidos', async () => {
      // Arrange - Preparar dados inválidos (title vazio)
      const invalidTrainingData = {
        title: '', // Campo obrigatório vazio
        description: 'Descrição válida',
        youtubeUrl: 'https://youtube.com/watch?v=validurl',
      };

      // Act & Assert - Tentar criar com dados inválidos deve falhar
      await request(app.getHttpServer())
        .post('/trainings')
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(invalidTrainingData)
        .expect(HttpStatus.BAD_REQUEST);
      // Teste adicional: URL inválida
      const invalidUrlData = {
        title: 'Título válido',
        description: 'Descrição válida',
        youtubeUrl: 'url-malformada', // URL inválida
      };

      // Act & Assert - URL inválida deve falhar
      await request(app.getHttpServer())
        .post('/trainings')
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(invalidUrlData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('Não deve permitir acesso sem token de autenticação', async () => {
      // Arrange - Preparar dados válidos
      const validTrainingData = {
        title: 'Treinamento sem autenticação',
        description: 'Tentativa de criação sem token',
        youtubeUrl: 'https://youtube.com/watch?v=noauth',
      };

      // Act & Assert - Tentar criar sem token deve falhar
      await request(app.getHttpServer())
        .post('/trainings')
        .send(validTrainingData)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});