import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { TournamentType } from '@/domain/enums/tournament-type.enum';

import {
  setupTournamentApp,
  createAdminUser,
  createHolderUser,
  createRegularUser,
  createTestTournament,
  tournamentCleanup,
  TournamentTestUser,
  TournamentTestData,
} from './setup';

describe('(E2E) UpdateTournament', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let adminUser: TournamentTestUser;
  let holderUser: TournamentTestUser;
  let regularUser: TournamentTestUser;
  let testTournament: TournamentTestData;
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

  beforeEach(async () => {
    // Criar novo torneio para cada teste para garantir estado limpo
    testTournament = await createTestTournament(prisma, {
      name: 'Torneio Para Atualizar',
      description: 'Descrição original do torneio para testes de atualização E2E',
      type: TournamentType.INDIVIDUAL,
    });
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
    it('Deve atualizar um torneio com dados válidos e retornar 200', async () => {
      // Arrange
      const updateData = {
        name: 'Torneio Atualizado com Sucesso',
        description: 'Nova descrição detalhada do torneio após atualização via E2E tests',
        type: TournamentType.DUO,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post(`/tournaments/${testTournament.id}/update`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toMatchObject({
        id: testTournament.id,
        name: updateData.name,
        description: updateData.description,
        type: updateData.type,
        updatedAt: expect.any(String),
      });

      // Verificar no banco se o torneio foi atualizado corretamente
      const updatedTournament = await prisma.tournament.findUnique({
        where: { id: testTournament.id },
      });

      expect(updatedTournament).toBeDefined();
      expect(updatedTournament?.name).toBe(updateData.name);
      expect(updatedTournament?.description).toBe(updateData.description);
      expect(updatedTournament?.type).toBe(updateData.type);
    });
  });

  describe('Autorização e Autenticação', () => {
    it('Não deve permitir a atualização por um Holder e deve retornar 403', async () => {
      // Arrange
      const updateData = {
        name: 'Tentativa de Atualização por Holder',
        description: 'Descrição de teste para verificar autorização de holder',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post(`/tournaments/${testTournament.id}/update`)
        .set('Authorization', `Bearer ${holderUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('Não deve permitir a atualização por um usuário não autenticado e deve retornar 401', async () => {
      // Arrange
      const updateData = {
        name: 'Tentativa sem Autenticação',
        description: 'Descrição de teste para verificar autenticação',
      };

      // Act
      const response = await request(app.getHttpServer()).post(`/tournaments/${testTournament.id}/update`).send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Validação e Lógica de Negócio', () => {
    it('Deve retornar 404 se o ID do torneio a ser atualizado não existir', async () => {
      // Arrange
      const nonExistentId = crypto.randomUUID();
      const updateData = {
        name: 'Tentativa de Atualizar Inexistente',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post(`/tournaments/${nonExistentId}/update`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('Não deve atualizar um torneio com dados inválidos e deve retornar 400', async () => {
      // Arrange
      const invalidData = {
        name: '', // Nome inválido
        description: 'Descrição válida para teste de validação',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post(`/tournaments/${testTournament.id}/update`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it.skip('[Future] Não deve atualizar um torneio que já possui inscrições', async () => {
      // Este teste está marcado como skip pois a funcionalidade de inscrições
      // será implementada em especificações futuras
      // Quando implementado, deve verificar que torneios com registrationCount > 0
      // não podem ser atualizados e retornam erro apropriado
    });
  });
});
