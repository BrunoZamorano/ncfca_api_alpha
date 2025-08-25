import * as request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { TournamentType } from '@/domain/enums/tournament-type.enum';

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

describe('(E2E) ListTournaments', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminUser: TournamentTestUser;
  let holderUser: TournamentTestUser;
  let regularUser: TournamentTestUser;
  let testTournament1: TournamentTestData;
  let testTournament2: TournamentTestData;
  let testTournament3: TournamentTestData;
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

    // Criar torneios para teste
    testTournament1 = await createTestTournament(prisma, {
      name: 'Torneio Individual Alpha',
      type: TournamentType.INDIVIDUAL,
    });

    testTournament2 = await createTestTournament(prisma, {
      name: 'Torneio Duo Beta',
      type: TournamentType.DUO,
    });

    testTournament3 = await createTestTournament(prisma, {
      name: 'Torneio Individual Gamma',
      type: TournamentType.INDIVIDUAL,
    });

    // Criar torneio deletado
    deletedTournament = await createDeletedTestTournament(prisma, {
      name: 'Torneio Deletado',
      type: TournamentType.INDIVIDUAL,
    });
  });

  afterAll(async () => {
    // Cleanup cirúrgico
    await tournamentCleanup(prisma, testUsers);
    await app.close();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('Cenários de Sucesso', () => {
    it('Deve retornar uma lista de torneios para um Admin e retornar 200', async () => {
      // Arrange - Torneios já criados no beforeAll

      // Act
      const response = await request(app.getHttpServer()).get('/tournaments').set('Authorization', `Bearer ${adminUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);

      // Verificar estrutura dos itens da lista
      const tournament = response.body.find((t: any) => t.id === testTournament1.id);
      expect(tournament).toMatchObject({
        id: testTournament1.id,
        name: testTournament1.name,
        type: testTournament1.type,
        registrationStartDate: expect.any(String),
        registrationEndDate: expect.any(String),
        startDate: expect.any(String),
        registrationCount: expect.any(Number),
      });
    });

    it('Deve retornar uma lista de torneios para um Holder e retornar 200', async () => {
      // Arrange - Torneios já criados no beforeAll

      // Act
      const response = await request(app.getHttpServer()).get('/tournaments').set('Authorization', `Bearer ${holderUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    it('Deve retornar uma lista vazia se não houver torneios ativos', async () => {
      // Arrange - Soft delete todos os torneios não deletados
      await prisma.tournament.updateMany({
        where: {
          deleted_at: null,
        },
        data: {
          deleted_at: new Date(),
        },
      });

      // Act - Lista torneios para holder (não deve ver deletados)
      const response = await request(app.getHttpServer()).get('/tournaments').set('Authorization', `Bearer ${holderUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);

      // Restore - Restaurar torneios para outros testes
      await prisma.tournament.updateMany({
        where: {
          id: {
            in: [testTournament1.id, testTournament2.id, testTournament3.id],
          },
        },
        data: {
          deleted_at: null,
        },
      });
    });
  });

  describe('Autorização e Autenticação', () => {
    it('Não deve permitir o acesso por um usuário não autenticado e deve retornar 401', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/tournaments');

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Filtragem e Lógica de Negócio', () => {
    it('Não deve incluir torneios deletados na lista para um Holder', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/tournaments').set('Authorization', `Bearer ${holderUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      const deletedTournamentInList = response.body.find((t: any) => t.id === deletedTournament.id);
      expect(deletedTournamentInList).toBeUndefined();
    });

    it('Deve incluir torneios deletados na lista para um Admin se o filtro showDeleted=true for usado', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/tournaments')
        .query({ filter: { showDeleted: true } })
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      const deletedTournamentInList = response.body.find((t: any) => t.id === deletedTournament.id);
      expect(deletedTournamentInList).toBeDefined();
    });

    it('Deve filtrar torneios corretamente por nome', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/tournaments')
        .query({ filter: { name: testTournament1.name } })
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      const foundTournament = response.body.find((t: any) => t.name === testTournament1.name);
      expect(foundTournament).toBeDefined();
      expect(foundTournament.name).toBe(testTournament1.name);
    });

    it('Deve filtrar torneios corretamente por tipo', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/tournaments')
        .query({ filter: { type: TournamentType.DUO } })
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      const duoTournaments = response.body.filter((t: any) => t.type === TournamentType.DUO);
      expect(duoTournaments.length).toBeGreaterThanOrEqual(1);
      duoTournaments.forEach((tournament: any) => {
        expect(tournament.type).toBe(TournamentType.DUO);
      });
    });

    it('Deve suportar paginação corretamente', async () => {
      // Arrange - Verificar quantos torneios existem no total
      const allTournamentsResponse = await request(app.getHttpServer()).get('/tournaments').set('Authorization', `Bearer ${adminUser.accessToken}`);

      const totalTournaments = allTournamentsResponse.body.length;

      // Act - Fazer requisição com paginação
      const response = await request(app.getHttpServer())
        .get('/tournaments')
        .query({ pagination: { page: 1, limit: 2 } })
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.length).toBeLessThanOrEqual(2);

      // Se tiver mais de 2 torneios, verificar a segunda página
      if (totalTournaments > 2) {
        const secondPageResponse = await request(app.getHttpServer())
          .get('/tournaments')
          .query({ pagination: { page: 2, limit: 2 } })
          .set('Authorization', `Bearer ${adminUser.accessToken}`);

        expect(secondPageResponse.status).toBe(HttpStatus.OK);
        expect(secondPageResponse.body.length).toBeGreaterThan(0);
      }
    });
  });
});
