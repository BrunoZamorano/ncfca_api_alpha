import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { TournamentType } from '@/domain/enums/tournament-type.enum';

import { setupTournamentApp, createAdminUser, createHolderUser, createRegularUser, tournamentCleanup, TournamentTestUser } from './setup';

describe('(E2E) CreateTournament', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let adminUser: TournamentTestUser;
  let holderUser: TournamentTestUser;
  let regularUser: TournamentTestUser;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupTournamentApp());

    // Criar usuário admin
    adminUser = await createAdminUser(app, prisma);
    testUsers.push(adminUser.userId);

    // Criar usuário holder
    holderUser = await createHolderUser(app, prisma);
    testUsers.push(holderUser.userId);

    // Criar usuário regular
    regularUser = await createRegularUser(app, prisma);
    testUsers.push(regularUser.userId);
  });

  afterAll(async () => {
    // Cleanup cirúrgico
    await tournamentCleanup(prisma, testUsers);
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cenários de Sucesso', () => {
    it('Deve criar um torneio com dados válidos e retornar 201', async () => {
      // Arrange
      const validTournamentData = {
        name: 'Torneio Nacional de Debate',
        description: 'Um torneio nacional de debate para estudantes brasileiros participarem da NCFCA',
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 1 dia no futuro
        registrationEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 dias no futuro
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 dias no futuro
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/tournaments/create')
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(validTournamentData);

      // Assert
      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: 'Torneio Nacional de Debate',
        description: 'Um torneio nacional de debate para estudantes brasileiros participarem da NCFCA',
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: expect.any(String),
        registrationEndDate: expect.any(String),
        startDate: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      });

      // Verificar no banco se o torneio foi criado corretamente
      const createdTournament = await prisma.tournament.findUnique({
        where: { id: response.body.id },
      });

      expect(createdTournament).toBeDefined();
      expect(createdTournament?.name).toBe('Torneio Nacional de Debate');
      expect(createdTournament?.type).toBe(TournamentType.INDIVIDUAL);
    });
  });

  describe('Autorização e Autenticação', () => {
    it('Não deve permitir a criação por um Holder e deve retornar 403', async () => {
      // Arrange
      const validTournamentData = {
        name: 'Torneio Teste Holder',
        description: 'Descrição de teste para verificar autorização de holder',
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        registrationEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/tournaments/create')
        .set('Authorization', `Bearer ${holderUser.accessToken}`)
        .send(validTournamentData);

      // Assert
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('Não deve permitir a criação por um usuário não autenticado e deve retornar 401', async () => {
      // Arrange
      const validTournamentData = {
        name: 'Torneio Teste Não Auth',
        description: 'Descrição de teste para verificar autenticação',
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        registrationEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      };

      // Act
      const response = await request(app.getHttpServer()).post('/tournaments/create').send(validTournamentData);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Validação de Campos Obrigatórios', () => {
    it('Não deve criar um torneio com nome faltando e deve retornar 400', async () => {
      // Arrange
      const invalidData = {
        description: 'Descrição de teste para validação de nome',
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        registrationEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/tournaments/create')
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('Não deve criar um torneio com tipo inválido e deve retornar 400', async () => {
      // Arrange
      const invalidData = {
        name: 'Torneio Teste Tipo Inválido',
        description: 'Descrição de teste para validação de tipo',
        type: 'INVALID_TYPE',
        registrationStartDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        registrationEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/tournaments/create')
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('Não deve criar um torneio com data de inscrição final anterior à inicial e deve retornar 400', async () => {
      // Arrange
      const invalidData = {
        name: 'Torneio Teste Data Inválida',
        description: 'Descrição de teste para validação de datas',
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 dias no futuro
        registrationEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 1 dia no futuro (anterior ao start)
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/tournaments/create')
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('Não deve criar um torneio com formato de data inválido e deve retornar 400', async () => {
      // Arrange
      const invalidData = {
        name: 'Torneio Teste Formato Data',
        description: 'Descrição de teste para validação de formato de data',
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: 'invalid-date-format',
        registrationEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/tournaments/create')
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });
});
