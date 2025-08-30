import * as request from 'supertest';
import { Response } from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import { RegistrationStatus } from '@/domain/enums/registration-status.enum';
import { DependantType, DependantRelationship, Sex } from '@prisma/client';
import { RejectDuoRegistrationResponseDto } from '@/infraestructure/dtos/tournament/reject-duo-registration.dto';

import { setupTournamentApp, createHolderUser, createRegularUser, tournamentCleanup, TournamentTestUser } from './setup';

describe('(E2E) RejectDuoRegistration', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let holderUser1: TournamentTestUser;
  let holderUser2: TournamentTestUser;
  let regularUser: TournamentTestUser;
  const testUsers: string[] = [];
  const testTournaments: string[] = [];

  // Helper function to create registration with sync
  const createRegistrationWithSync = async (data: {
    tournamentId: string;
    competitorId: string;
    partnerId?: string;
    status: RegistrationStatus;
    type: TournamentType;
  }) => {
    const registrationId = crypto.randomUUID();
    const registration = await prisma.registration.create({
      data: {
        id: registrationId,
        tournament_id: data.tournamentId,
        competitor_id: data.competitorId,
        partner_id: data.partnerId || null,
        status: data.status,
        type: data.type,
        version: 1,
      },
    });

    await prisma.registrationSync.create({
      data: {
        id: crypto.randomUUID(),
        registration_id: registrationId,
        status: 'PENDING',
        attempts: 0,
      },
    });

    return registration;
  };

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupTournamentApp());

    // Criar usuários holders
    holderUser1 = await createHolderUser(app, prisma);
    testUsers.push(holderUser1.userId);

    holderUser2 = await createHolderUser(app, prisma);
    testUsers.push(holderUser2.userId);

    // Criar usuário regular
    regularUser = await createRegularUser(app, prisma);
    testUsers.push(regularUser.userId);
  });

  afterAll(async () => {
    // Cleanup cirúrgico
    await tournamentCleanup(prisma, testUsers, testTournaments);
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cenários de Sucesso', () => {
    it('Deve rejeitar uma inscrição de dupla pendente com sucesso e retornar 200', async () => {
      // Arrange
      // Criar torneio
      const tournament = await prisma.tournament.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Torneio Duo Test',
          description: 'Torneio para teste de rejeição de dupla',
          type: TournamentType.DUO,
          registration_start_date: new Date(Date.now() - 86400000), // ontem
          registration_end_date: new Date(Date.now() + 86400000), // amanhã
          start_date: new Date(Date.now() + 86400000 * 7), // 7 dias no futuro
        },
      });
      testTournaments.push(tournament.id);

      // Criar dependentes para os holders
      const dependant1 = await prisma.dependant.create({
        data: {
          id: crypto.randomUUID(),
          family_id: holderUser1.familyId,
          first_name: 'Dependant',
          last_name: '1',
          birthdate: new Date('2005-01-01'),
          relationship: DependantRelationship.SON,
          type: DependantType.STUDENT,
          sex: Sex.MALE,
          email: 'dependant1@test.com',
          phone: '11999999999',
        },
      });

      const dependant2 = await prisma.dependant.create({
        data: {
          id: crypto.randomUUID(),
          family_id: holderUser2.familyId,
          first_name: 'Dependant',
          last_name: '2',
          birthdate: new Date('2005-01-02'),
          relationship: DependantRelationship.DAUGHTER,
          type: DependantType.STUDENT,
          sex: Sex.FEMALE,
          email: 'dependant2@test.com',
          phone: '11999999998',
        },
      });

      // Criar registro pendente com sync
      const registration = await createRegistrationWithSync({
        tournamentId: tournament.id,
        competitorId: dependant1.id,
        partnerId: dependant2.id,
        status: RegistrationStatus.PENDING_APPROVAL,
        type: TournamentType.DUO,
      });

      // Act
      const response: Response = await request(app.getHttpServer())
        .post(`/tournaments/registrations/${registration.id}/reject`)
        .set('Authorization', `Bearer ${holderUser2.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      const body = response.body as RejectDuoRegistrationResponseDto;
      expect(body).toMatchObject({
        message: 'Inscrição de dupla rejeitada com sucesso',
      });

      // Verificar no banco se o registro foi rejeitado
      const updatedRegistration = await prisma.registration.findUnique({
        where: { id: registration.id },
      });

      expect(updatedRegistration).toBeDefined();
      expect(updatedRegistration?.status).toBe(RegistrationStatus.REJECTED);
    });
  });

  describe('Cenários de Erro de Autorização', () => {
    it('Não deve permitir rejeitar sem autenticação e deve retornar 401', async () => {
      // Arrange
      const fakeRegistrationId = crypto.randomUUID();

      // Act
      const response: Response = await request(app.getHttpServer()).post(`/tournaments/registrations/${fakeRegistrationId}/reject`);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('Não deve permitir que usuário regular rejeite inscrição e deve retornar 403', async () => {
      // Arrange
      const fakeRegistrationId = crypto.randomUUID();

      // Act
      const response: Response = await request(app.getHttpServer())
        .post(`/tournaments/registrations/${fakeRegistrationId}/reject`)
        .set('Authorization', `Bearer ${regularUser.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('Cenários de Erro de Validação', () => {
    it('Deve retornar 404 quando torneio não for encontrado', async () => {
      // Arrange
      const fakeRegistrationId = crypto.randomUUID();

      // Act
      const response: Response = await request(app.getHttpServer())
        .post(`/tournaments/registrations/${fakeRegistrationId}/reject`)
        .set('Authorization', `Bearer ${holderUser1.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('Deve retornar 400 quando registro não está pendente de aprovação', async () => {
      // Arrange
      // Criar torneio
      const tournament = await prisma.tournament.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Torneio Duo Test Confirmed',
          description: 'Torneio para teste de rejeição de dupla já confirmada',
          type: TournamentType.DUO,
          registration_start_date: new Date(Date.now() - 86400000), // ontem
          registration_end_date: new Date(Date.now() + 86400000), // amanhã
          start_date: new Date(Date.now() + 86400000 * 7), // 7 dias no futuro
        },
      });
      testTournaments.push(tournament.id);

      // Criar dependentes
      const dependant1 = await prisma.dependant.create({
        data: {
          id: crypto.randomUUID(),
          family_id: holderUser1.familyId,
          first_name: 'Dependant',
          last_name: 'A',
          birthdate: new Date('2005-01-01'),
          relationship: DependantRelationship.SON,
          type: DependantType.STUDENT,
          sex: Sex.MALE,
          email: 'dependanta@test.com',
          phone: '11999999997',
        },
      });

      const dependant2 = await prisma.dependant.create({
        data: {
          id: crypto.randomUUID(),
          family_id: holderUser2.familyId,
          first_name: 'Dependant',
          last_name: 'B',
          birthdate: new Date('2005-01-02'),
          relationship: DependantRelationship.DAUGHTER,
          sex: Sex.FEMALE,
          email: 'dependantb@test.com',
          phone: '11999999996',
          type: DependantType.STUDENT,
        },
      });

      // Criar registro já confirmado
      const registration = await createRegistrationWithSync({
        tournamentId: tournament.id,
        competitorId: dependant1.id,
        partnerId: dependant2.id,
        status: RegistrationStatus.CONFIRMED,
        type: TournamentType.DUO,
      });

      // Act
      const response: Response = await request(app.getHttpServer())
        .post(`/tournaments/registrations/${registration.id}/reject`)
        .set('Authorization', `Bearer ${holderUser2.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect((response.body as { message: string }).message).toContain('Registration is not pending approval');
    });

    it('Deve retornar 404 quando torneio estiver deletado', async () => {
      // Arrange
      // Criar torneio deletado
      const tournament = await prisma.tournament.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Torneio Duo Test Deleted',
          description: 'Torneio deletado para teste de rejeição',
          type: TournamentType.DUO,
          registration_start_date: new Date(Date.now() - 86400000), // ontem
          registration_end_date: new Date(Date.now() + 86400000), // amanhã
          start_date: new Date(Date.now() + 86400000 * 7), // 7 dias no futuro
          deleted_at: new Date(), // torneio deletado
        },
      });
      testTournaments.push(tournament.id);

      // Criar dependentes
      const dependant1 = await prisma.dependant.create({
        data: {
          id: crypto.randomUUID(),
          family_id: holderUser1.familyId,
          first_name: 'Dependant',
          last_name: 'C',
          birthdate: new Date('2005-01-01'),
          relationship: DependantRelationship.SON,
          sex: Sex.MALE,
          email: 'dependantc@test.com',
          phone: '11999999995',
          type: DependantType.STUDENT,
        },
      });

      const dependant2 = await prisma.dependant.create({
        data: {
          id: crypto.randomUUID(),
          family_id: holderUser2.familyId,
          first_name: 'Dependant',
          last_name: 'D',
          birthdate: new Date('2005-01-02'),
          relationship: DependantRelationship.DAUGHTER,
          sex: Sex.FEMALE,
          email: 'dependantd@test.com',
          phone: '11999999994',
          type: DependantType.STUDENT,
        },
      });

      // Criar registro pendente no torneio deletado
      const registration = await createRegistrationWithSync({
        tournamentId: tournament.id,
        competitorId: dependant1.id,
        partnerId: dependant2.id,
        status: RegistrationStatus.PENDING_APPROVAL,
        type: TournamentType.DUO,
      });

      // Act
      const response: Response = await request(app.getHttpServer())
        .post(`/tournaments/registrations/${registration.id}/reject`)
        .set('Authorization', `Bearer ${holderUser2.accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('Verificações de Integridade', () => {
    it('Deve atualizar a versão do torneio para controle de concorrência', async () => {
      // Arrange
      // Criar torneio
      const tournament = await prisma.tournament.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Torneio Duo Versão Test',
          description: 'Torneio para teste de controle de versão',
          type: TournamentType.DUO,
          registration_start_date: new Date(Date.now() - 86400000), // ontem
          registration_end_date: new Date(Date.now() + 86400000), // amanhã
          start_date: new Date(Date.now() + 86400000 * 7), // 7 dias no futuro
          version: 1,
        },
      });
      testTournaments.push(tournament.id);

      // Criar dependentes
      const dependant1 = await prisma.dependant.create({
        data: {
          id: crypto.randomUUID(),
          family_id: holderUser1.familyId,
          first_name: 'Dependant',
          last_name: 'E',
          birthdate: new Date('2005-01-01'),
          relationship: DependantRelationship.SON,
          sex: Sex.MALE,
          email: 'dependante@test.com',
          phone: '11999999993',
          type: DependantType.STUDENT,
        },
      });

      const dependant2 = await prisma.dependant.create({
        data: {
          id: crypto.randomUUID(),
          family_id: holderUser2.familyId,
          first_name: 'Dependant',
          last_name: 'F',
          birthdate: new Date('2005-01-02'),
          relationship: DependantRelationship.DAUGHTER,
          sex: Sex.FEMALE,
          email: 'dependantf@test.com',
          phone: '11999999992',
          type: DependantType.STUDENT,
        },
      });

      // Criar registro pendente
      const registration = await createRegistrationWithSync({
        tournamentId: tournament.id,
        competitorId: dependant1.id,
        partnerId: dependant2.id,
        status: RegistrationStatus.PENDING_APPROVAL,
        type: TournamentType.DUO,
      });

      // Act
      await request(app.getHttpServer())
        .post(`/tournaments/registrations/${registration.id}/reject`)
        .set('Authorization', `Bearer ${holderUser2.accessToken}`);

      // Assert
      const updatedTournament = await prisma.tournament.findUnique({
        where: { id: tournament.id },
      });

      expect(updatedTournament?.version).toBe(2); // versão incrementada
      expect(updatedTournament?.updated_at).toBeDefined();
    });
  });
});
