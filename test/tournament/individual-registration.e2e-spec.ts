import * as request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { DependantRelationship, Sex, DependantType, SyncStatus } from '@prisma/client';
import { ClientProxy } from '@nestjs/microservices';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import { RegistrationStatus } from '@/domain/enums/registration-status.enum';
import { RegistrationType } from '@/domain/enums/registration-type.enum';

import { setupTournamentApp, createRegularUser, createAdminUser, createTestTournament, tournamentCleanup, TournamentTestUser } from './setup';
import { pollForCondition } from '../utils/poll-for-condition';
import { TOURNAMENT_EVENTS_SERVICE } from '@/shared/constants/event.constants';

describe('(E2E) TournamentIndividualRegistration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let client: ClientProxy;
  let holderUser: TournamentTestUser;
  let otherHolderUser: TournamentTestUser;
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

    otherHolderUser = await createRegularUser(app, prisma);
    testUsers.push(otherHolderUser.userId);

    adminUser = await createAdminUser(app, prisma);
    testUsers.push(adminUser.userId);
  });

  afterAll(async () => {
    // Cleanup cirúrgico
    await tournamentCleanup(prisma, testUsers, testTournaments);
    await client.close();
    await app.close();
  });

  afterEach(async () => {
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

  describe('Registro Individual - Casos de Sucesso', () => {
    it('Deve registrar competidor individual com sucesso e criar registros RegistrationSync', async () => {
      // Arrange
      const now = new Date();
      const tournament = await createTournamentForTest({
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date(now.getTime() - 86400000), // 1 dia no passado
        registrationEndDate: new Date(now.getTime() + 86400000 * 7), // 7 dias no futuro
      });

      const dependant = await createTestDependant(holderUser.familyId, {
        firstName: 'Pedro',
        lastName: 'Silva',
        email: 'pedro.silva@test.com',
      });

      const registrationData = {
        tournamentId: tournament.id,
        competitorId: dependant.id,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/tournaments/registrations/request-individual')
        .set('Authorization', `Bearer ${holderUser.accessToken}`)
        .send(registrationData);

      // Assert
      if (response.status !== HttpStatus.CREATED) {
        console.log('Response status:', response.status);
        console.log('Response body:', response.body);
      }
      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toMatchObject({
        registrationId: expect.any(String),
        status: RegistrationStatus.CONFIRMED,
      });

      // Verificar se o registro foi criado no banco
      const registration = await prisma.registration.findUnique({
        where: { id: response.body.registrationId },
      });

      expect(registration).toBeDefined();
      expect(registration?.tournament_id).toBe(tournament.id);
      expect(registration?.competitor_id).toBe(dependant.id);
      expect(registration?.status).toBe(RegistrationStatus.CONFIRMED);
      expect(registration?.type).toBe(RegistrationType.INDIVIDUAL);

      // Verificar se o RegistrationSync foi criado e eventualmente marcado como SYNCED
      await pollForCondition(
        async () => {
          const registrationSync = await prisma.registrationSync.findUnique({
            where: { registration_id: response.body.registrationId },
          });

          expect(registrationSync).toBeDefined();
          expect([SyncStatus.PENDING, SyncStatus.SYNCED]).toContain(registrationSync?.status);
        },
        5000,
        500,
      );
    }, 15000);
  });

  describe('Controle de Concorrência - Lock Otimista', () => {
    it('Deve permitir apenas uma inscrição quando enviadas simultaneamente para o mesmo competidor e torneio', async () => {
      // Arrange
      const now = new Date();
      const tournament = await createTournamentForTest({
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date(now.getTime() - 86400000), // 1 dia no passado
        registrationEndDate: new Date(now.getTime() + 86400000 * 7), // 7 dias no futuro
      });

      const dependant = await createTestDependant(holderUser.familyId, {
        firstName: 'Ana',
        lastName: 'Santos',
        email: 'ana.santos@test.com',
      });

      const registrationData = {
        tournamentId: tournament.id,
        competitorId: dependant.id,
      };

      // Act - Enviar duas requisições simultâneas
      const [response1, response2] = await Promise.all([
        request(app.getHttpServer())
          .post('/tournaments/registrations/request-individual')
          .set('Authorization', `Bearer ${holderUser.accessToken}`)
          .send(registrationData),
        request(app.getHttpServer())
          .post('/tournaments/registrations/request-individual')
          .set('Authorization', `Bearer ${holderUser.accessToken}`)
          .send(registrationData),
      ]);

      // Assert - Uma deve ter sucesso e a outra deve falhar com conflito
      const responses = [response1, response2];
      const successfulResponses = responses.filter((r) => r.status === HttpStatus.CREATED);
      const conflictResponses = responses.filter((r) => r.status === HttpStatus.CONFLICT);

      expect(successfulResponses).toHaveLength(1);
      expect(conflictResponses).toHaveLength(1);

      // Verificar se apenas um registro foi criado no banco
      const registrations = await prisma.registration.findMany({
        where: {
          tournament_id: tournament.id,
          competitor_id: dependant.id,
        },
      });

      expect(registrations).toHaveLength(1);
    });
  });

  describe('Cancelamento de Registro', () => {
    it('Deve cancelar registro individual com sucesso', async () => {
      // Arrange
      const now = new Date();
      const tournament = await createTournamentForTest({
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date(now.getTime() - 86400000), // 1 dia no passado
        registrationEndDate: new Date(now.getTime() + 86400000 * 7), // 7 dias no futuro
      });

      const dependant = await createTestDependant(holderUser.familyId, {
        firstName: 'Carlos',
        lastName: 'Oliveira',
        email: 'carlos.oliveira@test.com',
      });

      // Criar registro primeiro
      const registrationResponse = await request(app.getHttpServer())
        .post('/tournaments/registrations/request-individual')
        .set('Authorization', `Bearer ${holderUser.accessToken}`)
        .send({
          tournamentId: tournament.id,
          competitorId: dependant.id,
        });

      expect(registrationResponse.status).toBe(HttpStatus.CREATED);

      const cancelData = {
        registrationId: registrationResponse.body.registrationId,
        reason: 'Conflito de agenda',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/tournaments/registrations/cancel')
        .set('Authorization', `Bearer ${holderUser.accessToken}`)
        .send(cancelData);

      // Assert
      if (response.status !== HttpStatus.OK) {
        console.log('Cancellation response status:', response.status);
        console.log('Cancellation response body:', response.body);
      }
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toMatchObject({
        message: 'Inscrição cancelada com sucesso',
      });

      // Verificar se o status foi atualizado no banco
      const registration = await prisma.registration.findUnique({
        where: { id: registrationResponse.body.registrationId },
      });

      expect(registration?.status).toBe(RegistrationStatus.CANCELLED);
    });
  });

  describe('Prevenção de Registro Duplicado', () => {
    it('Não deve permitir o mesmo competidor se registrar duas vezes no mesmo torneio', async () => {
      // Arrange
      const now = new Date();
      const tournament = await createTournamentForTest({
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date(now.getTime() - 86400000), // 1 dia no passado
        registrationEndDate: new Date(now.getTime() + 86400000 * 7), // 7 dias no futuro
      });

      const dependant = await createTestDependant(holderUser.familyId, {
        firstName: 'Maria',
        lastName: 'Costa',
        email: 'maria.costa@test.com',
      });

      const registrationData = {
        tournamentId: tournament.id,
        competitorId: dependant.id,
      };

      // Registrar pela primeira vez
      const firstRegistration = await request(app.getHttpServer())
        .post('/tournaments/registrations/request-individual')
        .set('Authorization', `Bearer ${holderUser.accessToken}`)
        .send(registrationData);

      expect(firstRegistration.status).toBe(HttpStatus.CREATED);

      // Act - Tentar registrar novamente
      const secondRegistration = await request(app.getHttpServer())
        .post('/tournaments/registrations/request-individual')
        .set('Authorization', `Bearer ${holderUser.accessToken}`)
        .send(registrationData);

      // Assert
      if (secondRegistration.status !== HttpStatus.CONFLICT) {
        console.log('Duplicate registration response status:', secondRegistration.status);
        console.log('Duplicate registration response body:', secondRegistration.body);
      }
      expect(secondRegistration.status).toBe(HttpStatus.CONFLICT);

      // Verificar se apenas um registro existe no banco
      const registrations = await prisma.registration.findMany({
        where: {
          tournament_id: tournament.id,
          competitor_id: dependant.id,
        },
      });

      expect(registrations).toHaveLength(1);
    });
  });

  describe('Validação de Dados', () => {
    it('Não deve registrar com tournamentId inválido', async () => {
      // Arrange
      const dependant = await createTestDependant(holderUser.familyId);

      const registrationData = {
        tournamentId: 'invalid-tournament-id',
        competitorId: dependant.id,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/tournaments/registrations/request-individual')
        .set('Authorization', `Bearer ${holderUser.accessToken}`)
        .send(registrationData);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('Não deve registrar com competitorId inválido', async () => {
      // Arrange
      const tournament = await createTournamentForTest({
        type: TournamentType.INDIVIDUAL,
      });

      const registrationData = {
        tournamentId: tournament.id,
        competitorId: 'invalid-competitor-id',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/tournaments/registrations/request-individual')
        .set('Authorization', `Bearer ${holderUser.accessToken}`)
        .send(registrationData);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('Não deve registrar com campos obrigatórios faltando', async () => {
      // Arrange
      const incompleteData = {
        tournamentId: 'some-id',
        // competitorId missing
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/tournaments/registrations/request-individual')
        .set('Authorization', `Bearer ${holderUser.accessToken}`)
        .send(incompleteData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Autorização e Autenticação', () => {
    it('Não deve permitir registro sem autenticação', async () => {
      // Arrange
      const tournament = await createTournamentForTest({
        type: TournamentType.INDIVIDUAL,
      });

      const dependant = await createTestDependant(holderUser.familyId);

      const registrationData = {
        tournamentId: tournament.id,
        competitorId: dependant.id,
      };

      // Act
      const response = await request(app.getHttpServer()).post('/tournaments/registrations/request-individual').send(registrationData);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Regras de Negócio', () => {
    it('Não deve registrar em torneio que ainda não abriu inscrições', async () => {
      // Arrange - Criar torneio com inscrições no futuro
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 dias no futuro

      const tournament = await createTournamentForTest({
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: futureDate,
      });

      const dependant = await createTestDependant(holderUser.familyId);

      const registrationData = {
        tournamentId: tournament.id,
        competitorId: dependant.id,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/tournaments/registrations/request-individual')
        .set('Authorization', `Bearer ${holderUser.accessToken}`)
        .send(registrationData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('Não deve registrar em torneio com inscrições fechadas', async () => {
      // Arrange - Criar torneio com inscrições já encerradas
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7); // 7 dias no passado

      const tournament = await createTournamentForTest({
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date(pastDate.getTime() - 86400000), // 1 dia antes do fim
        registrationEndDate: pastDate,
      });

      const dependant = await createTestDependant(holderUser.familyId);

      const registrationData = {
        tournamentId: tournament.id,
        competitorId: dependant.id,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/tournaments/registrations/request-individual')
        .set('Authorization', `Bearer ${holderUser.accessToken}`)
        .send(registrationData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });
});
