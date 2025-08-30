import * as request from 'supertest';
import { Response } from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import { TournamentDetailsView } from '@/application/queries/tournament-query/tournament-details.view';

import {
  setupTournamentApp,
  createAdminUser,
  createHolderUser,
  createRegularUser,
  createTestTournament,
  createDeletedTestTournament,
  tournamentCleanup,
  TournamentTestUser,
  TournamentTestData,
} from './setup';

describe('(E2E) GetTournamentDetails', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let adminUser: TournamentTestUser;
  let holderUser: TournamentTestUser;
  let regularUser: TournamentTestUser;
  let testTournament: TournamentTestData;
  let deletedTournament: TournamentTestData;
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

    // Criar torneio para teste
    testTournament = await createTestTournament(prisma, {
      name: 'Torneio Detalhes Test',
      description: 'Descrição detalhada do torneio para testes de visualização E2E',
      type: TournamentType.INDIVIDUAL,
    });

    // Criar torneio deletado
    deletedTournament = await createDeletedTestTournament(prisma, {
      name: 'Torneio Deletado Details',
      description: 'Descrição do torneio deletado para testes de visualização',
      type: TournamentType.DUO,
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
    it('Deve retornar os detalhes de um torneio para um Admin e retornar 200', async () => {
      // Act
      const response: Response = await request(app.getHttpServer())
        .get(`/tournaments/${testTournament.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      const body = response.body as TournamentDetailsView;
      expect(body).toMatchObject({
        id: testTournament.id,
        name: testTournament.name,
        description: testTournament.description,
        type: testTournament.type,
        registrationStartDate: expect.any(String) as string,
        registrationEndDate: expect.any(String) as string,
        startDate: expect.any(String) as string,
        registrationCount: expect.any(Number) as number,
        createdAt: expect.any(String) as string,
      });

      // Verificar se deletedAt não está presente (torneio não deletado)
      expect(body.deletedAt).toBeUndefined();
    });

    it('Deve retornar os detalhes de um torneio para um Holder e retornar 200', async () => {
      // Act
      const response: Response = await request(app.getHttpServer())
        .get(`/tournaments/${testTournament.id}`)
        .set('Authorization', `Bearer ${holderUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      const body = response.body as TournamentDetailsView;
      expect(body).toMatchObject({
        id: testTournament.id,
        name: testTournament.name,
        description: testTournament.description,
        type: testTournament.type,
        registrationStartDate: expect.any(String) as string,
        registrationEndDate: expect.any(String) as string,
        startDate: expect.any(String) as string,
        registrationCount: expect.any(Number) as number,
      });
    });
  });

  describe('Autorização e Autenticação', () => {
    it('Não deve permitir o acesso por um usuário não autenticado e deve retornar 401', async () => {
      // Act
      const response: Response = await request(app.getHttpServer()).get(`/tournaments/${testTournament.id}`);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Lógica de Negócio', () => {
    it('Deve retornar 404 se o ID do torneio não existir', async () => {
      // Arrange
      const nonExistentId = crypto.randomUUID();

      // Act
      const response: Response = await request(app.getHttpServer())
        .get(`/tournaments/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('Não deve retornar um torneio deletado para um Holder e deve retornar 404', async () => {
      // Act
      const response: Response = await request(app.getHttpServer())
        .get(`/tournaments/${deletedTournament.id}`)
        .set('Authorization', `Bearer ${holderUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
