import * as request from 'supertest';
import { Response } from 'supertest';
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

describe('(E2E) DeleteTournament', () => {
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
      name: 'Torneio Para Deletar',
      description: 'Descrição do torneio para testes de deleção (soft delete) E2E',
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
    it('Deve realizar o soft-delete de um torneio e retornar 200', async () => {
      // Act
      const response: Response = await request(app.getHttpServer())
        .post(`/tournaments/${testTournament.id}/delete`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.CREATED);

      // Verificar no banco se o torneio foi deletado (soft delete)
      const deletedTournament = await prisma.tournament.findUnique({
        where: { id: testTournament.id },
      });

      expect(deletedTournament).toBeDefined();
      expect(deletedTournament?.deleted_at).not.toBeNull();
      expect(deletedTournament?.updated_at).toBeDefined();
    });
  });

  describe('Autorização e Autenticação', () => {
    it('Não deve permitir a deleção por um Holder e deve retornar 403', async () => {
      // Act
      const response: Response = await request(app.getHttpServer())
        .post(`/tournaments/${testTournament.id}/delete`)
        .set('Authorization', `Bearer ${holderUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.FORBIDDEN);

      // Verificar que o torneio não foi deletado
      const tournament = await prisma.tournament.findUnique({
        where: { id: testTournament.id },
      });

      expect(tournament).toBeDefined();
      expect(tournament?.deleted_at).toBeNull();
    });

    it('Não deve permitir a deleção por um usuário não autenticado e deve retornar 401', async () => {
      // Act
      const response: Response = await request(app.getHttpServer()).post(`/tournaments/${testTournament.id}/delete`);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);

      // Verificar que o torneio não foi deletado
      const tournament = await prisma.tournament.findUnique({
        where: { id: testTournament.id },
      });

      expect(tournament).toBeDefined();
      expect(tournament?.deleted_at).toBeNull();
    });
  });

  describe('Lógica de Negócio', () => {
    it('Deve retornar 404 se o ID do torneio a ser deletado não existir', async () => {
      // Arrange
      const nonExistentId = crypto.randomUUID();

      // Act
      const response = await request(app.getHttpServer())
        .post(`/tournaments/${nonExistentId}/delete`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('Deve retornar 404 se tentar deletar um torneio já deletado', async () => {
      // Arrange - Deletar o torneio primeiro
      await request(app.getHttpServer()).post(`/tournaments/${testTournament.id}/delete`).set('Authorization', `Bearer ${adminUser.accessToken}`);

      // Act - Tentar deletar novamente
      const response: Response = await request(app.getHttpServer())
        .post(`/tournaments/${testTournament.id}/delete`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);

      // Verificar que continua deletado
      const deletedTournament = await prisma.tournament.findUnique({
        where: { id: testTournament.id },
      });

      expect(deletedTournament).toBeDefined();
      expect(deletedTournament?.deleted_at).not.toBeNull();
    });

    it.skip('[Future] Não deve deletar um torneio que já possui inscrições', async () => {
      // Este teste está marcado como skip pois a funcionalidade de inscrições
      // será implementada em especificações futuras
      // Quando implementado, deve verificar que torneios com registrationCount > 0
      // não podem ser deletados e retornam erro apropriado
    });
  });
});
