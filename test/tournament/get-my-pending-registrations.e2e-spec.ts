import * as request from 'supertest';
import { Response } from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { DependantRelationship, Sex, DependantType } from '@prisma/client';
import { ClientProxy } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';

import { GetMyPendingRegistrationsListItemView } from '@/application/queries/tournament-query/get-my-pending-registrations-list-item.view';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import { RegistrationStatus } from '@/domain/enums/registration-status.enum';

import { setupTournamentApp, createRegularUser, createAdminUser, createTestTournament, tournamentCleanup, TournamentTestUser } from './setup';
import { TOURNAMENT_EVENTS_SERVICE } from '@/shared/constants/event.constants';

interface ErrorResponseDto {
  statusCode: number;
  message: string | string[];
  error: string;
}

describe('(E2E) GetMyPendingRegistrations', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let client: ClientProxy;
  let holderUser: TournamentTestUser;
  let partnerHolderUser: TournamentTestUser;
  let adminUser: TournamentTestUser;
  const testUsers: string[] = [];
  const testTournaments: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupTournamentApp());

    // Obter client para RabbitMQ
    client = app.get(TOURNAMENT_EVENTS_SERVICE);
    await client.connect();

    // Criar usuários de teste
    holderUser = await createRegularUser(app, prisma);
    testUsers.push(holderUser.userId);

    partnerHolderUser = await createRegularUser(app, prisma);
    testUsers.push(partnerHolderUser.userId);

    adminUser = await createAdminUser(app, prisma);
    testUsers.push(adminUser.userId);
  });

  afterAll(async () => {
    // Cleanup cirúrgico
    await tournamentCleanup(prisma, testUsers, testTournaments);
    await client.close();
    await app.close();
  });

  beforeEach(async () => {
    // Limpar registrações antes de cada teste para garantir isolamento
    await prisma.registrationSync.deleteMany({});
    await prisma.registration.deleteMany({
      where: {
        tournament: {
          id: {
            in: testTournaments,
          },
        },
      },
    });
    jest.clearAllMocks();
  });

  /**
   * Cria um torneio e registra o ID para cleanup
   */
  async function createTournamentForTest(overrides = {}) {
    const tournament = await createTestTournament(prisma, overrides);
    testTournaments.push(tournament.id);
    return tournament;
  }

  /**
   * Cria um dependente para uma família específica nos testes
   */
  async function createTestDependant(
    familyId: string,
    options: {
      firstName?: string;
      lastName?: string;
      email?: string;
    } = {},
  ) {
    const dependantData = {
      id: crypto.randomUUID(),
      first_name: options.firstName || 'João',
      last_name: options.lastName || 'Competitor',
      birthdate: new Date('2012-01-15'),
      relationship: DependantRelationship.SON,
      type: DependantType.STUDENT,
      sex: Sex.MALE,
      email: options.email || `competitor-${crypto.randomUUID().substring(0, 8)}@test.com`,
      phone: null,
      family_id: familyId,
    };

    return prisma.dependant.create({
      data: dependantData,
    });
  }

  /**
   * Cria uma inscrição de dupla pendente diretamente no banco para testes
   */
  async function createPendingDuoRegistration(tournamentId: string, competitorId: string, partnerId: string) {
    const registrationData = {
      id: crypto.randomUUID(),
      tournament_id: tournamentId,
      competitor_id: competitorId,
      partner_id: partnerId,
      status: RegistrationStatus.PENDING_APPROVAL,
      type: TournamentType.DUO,
      version: 1,
    };

    return prisma.registration.create({
      data: registrationData,
    });
  }

  describe('Busca de Inscrições Pendentes - Casos de Sucesso', () => {
    it('Deve retornar lista vazia quando não há inscrições pendentes', async () => {
      // Act
      const response: Response = await request(app.getHttpServer())
        .get('/tournaments/my-pending-registrations')
        .set('Authorization', `Bearer ${partnerHolderUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      const body = response.body as GetMyPendingRegistrationsListItemView[];

      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });

    it('Deve retornar inscrições pendentes para dependentes do holder', async () => {
      // Arrange
      const now = new Date();
      const tournament = await createTournamentForTest({
        name: 'Torneio Nacional Duplas 2024',
        type: TournamentType.DUO,
        registrationStartDate: new Date(now.getTime() - 86400000), // 1 dia no passado
        registrationEndDate: new Date(now.getTime() + 86400000 * 7), // 7 dias no futuro
      });

      // Criar competitor do holderUser
      const competitor = await createTestDependant(holderUser.familyId, {
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana.silva@test.com',
      });

      // Criar partner do partnerHolderUser
      const partner = await createTestDependant(partnerHolderUser.familyId, {
        firstName: 'Carlos',
        lastName: 'Santos',
        email: 'carlos.santos@test.com',
      });

      // Criar inscrição pendente
      const registration = await createPendingDuoRegistration(tournament.id, competitor.id, partner.id);

      // Act - Partner holder busca suas inscrições pendentes
      const response: Response = await request(app.getHttpServer())
        .get('/tournaments/my-pending-registrations')
        .set('Authorization', `Bearer ${partnerHolderUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      const body = response.body as GetMyPendingRegistrationsListItemView[];

      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);

      const pendingRegistration = body[0];
      expect(pendingRegistration.registrationId).toBe(registration.id);
      expect(pendingRegistration.tournamentName).toBe(tournament.name);
      expect(pendingRegistration.tournamentType).toBe(tournament.type);
      expect(pendingRegistration.competitorId).toBe(competitor.id);
      expect(pendingRegistration.competitorName).toBe('Ana Silva');
      expect(pendingRegistration.requestedAt).toBeDefined();
      expect(new Date(pendingRegistration.requestedAt)).toBeInstanceOf(Date);
    });

    it('Deve retornar múltiplas inscrições pendentes ordenadas por data decrescente', async () => {
      // Arrange
      const tournament1 = await createTournamentForTest({
        name: 'Primeiro Torneio',
        type: TournamentType.DUO,
      });

      const tournament2 = await createTournamentForTest({
        name: 'Segundo Torneio',
        type: TournamentType.DUO,
      });

      // Criar competitors
      const competitor1 = await createTestDependant(holderUser.familyId, {
        firstName: 'Maria',
        lastName: 'Costa',
      });

      const competitor2 = await createTestDependant(holderUser.familyId, {
        firstName: 'João',
        lastName: 'Oliveira',
      });

      // Criar partner do partnerHolderUser
      const partner = await createTestDependant(partnerHolderUser.familyId, {
        firstName: 'Pedro',
        lastName: 'Almeida',
      });

      // Criar duas inscrições pendentes com intervalos de tempo diferentes
      const firstRegistration = await createPendingDuoRegistration(tournament1.id, competitor1.id, partner.id);

      // Esperar um pouco para garantir timestamps diferentes
      await new Promise((resolve) => setTimeout(resolve, 100));

      const secondRegistration = await createPendingDuoRegistration(tournament2.id, competitor2.id, partner.id);

      // Act
      const response: Response = await request(app.getHttpServer())
        .get('/tournaments/my-pending-registrations')
        .set('Authorization', `Bearer ${partnerHolderUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      const body = response.body as GetMyPendingRegistrationsListItemView[];

      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);

      // Verificar ordenação por data decrescente (mais recente primeiro)
      expect(new Date(body[0].requestedAt).getTime()).toBeGreaterThanOrEqual(new Date(body[1].requestedAt).getTime());

      // Verificar dados das inscrições
      expect(body.some((reg) => reg.registrationId === firstRegistration.id)).toBe(true);
      expect(body.some((reg) => reg.registrationId === secondRegistration.id)).toBe(true);
      expect(body.some((reg) => reg.tournamentName === tournament1.name)).toBe(true);
      expect(body.some((reg) => reg.tournamentName === tournament2.name)).toBe(true);
    });

    it('Não deve retornar inscrições de outros holders', async () => {
      // Arrange
      const tournament = await createTournamentForTest({
        type: TournamentType.DUO,
      });

      // Criar competitor do holderUser
      const competitor = await createTestDependant(holderUser.familyId);

      // Criar partner de outro holder (não partnerHolderUser)
      const otherHolder = await createRegularUser(app, prisma);
      testUsers.push(otherHolder.userId);

      const otherPartner = await createTestDependant(otherHolder.familyId);

      // Criar inscrição pendente para outro holder
      await createPendingDuoRegistration(tournament.id, competitor.id, otherPartner.id);

      // Act - partnerHolderUser busca suas inscrições (não deveria ver a do outro holder)
      const response: Response = await request(app.getHttpServer())
        .get('/tournaments/my-pending-registrations')
        .set('Authorization', `Bearer ${partnerHolderUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      const body = response.body as GetMyPendingRegistrationsListItemView[];

      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0); // Não deve ver inscrições de outros holders
    });
  });

  describe('Filtros de Status', () => {
    it('Não deve retornar inscrições confirmadas', async () => {
      // Arrange
      const tournament = await createTournamentForTest({
        type: TournamentType.DUO,
      });

      const competitor = await createTestDependant(holderUser.familyId);
      const partner = await createTestDependant(partnerHolderUser.familyId);

      // Criar inscrição confirmada
      await prisma.registration.create({
        data: {
          id: crypto.randomUUID(),
          tournament_id: tournament.id,
          competitor_id: competitor.id,
          partner_id: partner.id,
          status: RegistrationStatus.CONFIRMED,
          type: TournamentType.DUO,
          version: 1,
        },
      });

      // Act
      const response: Response = await request(app.getHttpServer())
        .get('/tournaments/my-pending-registrations')
        .set('Authorization', `Bearer ${partnerHolderUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      const body = response.body as GetMyPendingRegistrationsListItemView[];

      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0); // Não deve retornar inscrições confirmadas
    });

    it('Não deve retornar inscrições rejeitadas', async () => {
      // Arrange
      const tournament = await createTournamentForTest({
        type: TournamentType.DUO,
      });

      const competitor = await createTestDependant(holderUser.familyId);
      const partner = await createTestDependant(partnerHolderUser.familyId);

      // Criar inscrição rejeitada
      await prisma.registration.create({
        data: {
          id: crypto.randomUUID(),
          tournament_id: tournament.id,
          competitor_id: competitor.id,
          partner_id: partner.id,
          status: RegistrationStatus.REJECTED,
          type: TournamentType.DUO,
          version: 1,
        },
      });

      // Act
      const response: Response = await request(app.getHttpServer())
        .get('/tournaments/my-pending-registrations')
        .set('Authorization', `Bearer ${partnerHolderUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      const body = response.body as GetMyPendingRegistrationsListItemView[];

      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0); // Não deve retornar inscrições rejeitadas
    });
  });

  describe('Autorização e Autenticação', () => {
    it('Não deve permitir acesso sem autenticação', async () => {
      // Act
      const response: Response = await request(app.getHttpServer()).get('/tournaments/my-pending-registrations');

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      const errorBody = response.body as ErrorResponseDto;
      expect(errorBody.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('Deve permitir acesso para usuários autenticados', async () => {
      // Act
      const response: Response = await request(app.getHttpServer())
        .get('/tournaments/my-pending-registrations')
        .set('Authorization', `Bearer ${partnerHolderUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('Deve permitir acesso para admin', async () => {
      // Act
      const response: Response = await request(app.getHttpServer())
        .get('/tournaments/my-pending-registrations')
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Estrutura da Resposta', () => {
    it('Deve retornar campos corretos na estrutura GetMyPendingRegistrationsListItemView', async () => {
      // Arrange
      const tournament = await createTournamentForTest({
        name: 'Torneio Estrutura',
        type: TournamentType.DUO,
      });

      const competitor = await createTestDependant(holderUser.familyId, {
        firstName: 'Test',
        lastName: 'Competitor',
      });

      const partner = await createTestDependant(partnerHolderUser.familyId);

      await createPendingDuoRegistration(tournament.id, competitor.id, partner.id);

      // Act
      const response: Response = await request(app.getHttpServer())
        .get('/tournaments/my-pending-registrations')
        .set('Authorization', `Bearer ${partnerHolderUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      const body = response.body as GetMyPendingRegistrationsListItemView[];

      expect(body).toHaveLength(1);

      const registration = body[0];
      expect(registration).toHaveProperty('registrationId');
      expect(registration).toHaveProperty('tournamentName');
      expect(registration).toHaveProperty('competitorName');
      expect(registration).toHaveProperty('competitorId');
      expect(registration).toHaveProperty('requestedAt');
      expect(registration).toHaveProperty('tournamentType');

      // Verificar tipos dos campos
      expect(typeof registration.registrationId).toBe('string');
      expect(typeof registration.tournamentName).toBe('string');
      expect(typeof registration.competitorName).toBe('string');
      expect(typeof registration.competitorId).toBe('string');
      expect(typeof registration.tournamentType).toBe('string');
      expect(registration.requestedAt).toBeDefined();

      // Verificar valores específicos
      expect(registration.tournamentName).toBe('Torneio Estrutura');
      expect(registration.competitorName).toBe('Test Competitor');
      expect(registration.tournamentType).toBe(TournamentType.DUO);
    });
  });
});
