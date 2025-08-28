import Tournament from './tournament.entity';
import { InvalidOperationException } from '@/domain/exceptions/domain-exception';
import IdGenerator from '@/application/services/id-generator';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import Dependant from '@/domain/entities/dependant/dependant';
import Registration from '@/domain/entities/registration/registration.entity';
import { RegistrationStatus } from '@/domain/enums/registration-status.enum';
import { RegistrationType } from '@/domain/enums/registration-type.enum';
import { EventEmitter } from '@/domain/events/event-emitter';

const mockIdGenerator: IdGenerator = {
  generate: jest.fn().mockImplementation(() => `mock-uuid-${Math.random()}`),
};

const mockDependant: Partial<Dependant> = {
  id: 'dependant-123',
  firstName: 'João',
  lastName: 'Silva',
  familyId: 'family-123',
};

const mockEventEmitter: EventEmitter = {
  emit: jest.fn(),
};

describe('(UNIT) Tournament Entity', () => {
  const validTournamentProps = {
    name: 'Torneio Nacional de Debate',
    description: 'Torneio nacional de debate para estudantes do ensino médio com foco em argumentação',
    type: TournamentType.INDIVIDUAL,
    registrationStartDate: new Date('2024-01-01'),
    registrationEndDate: new Date('2024-01-15'),
    startDate: new Date('2024-02-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Creation', () => {
    it('Deve criar um torneio com dados válidos', () => {
      // Arrange
      const props = { ...validTournamentProps };

      // Act
      const tournament = Tournament.create(props, mockIdGenerator);

      // Assert
      expect(tournament).toBeInstanceOf(Tournament);
      expect(tournament.name).toBe(props.name);
      expect(tournament.description).toBe(props.description);
      expect(tournament.type).toBe(props.type);
      expect(tournament.registrationStartDate).toEqual(props.registrationStartDate);
      expect(tournament.registrationEndDate).toEqual(props.registrationEndDate);
      expect(tournament.startDate).toEqual(props.startDate);
      expect(tournament.deletedAt).toBeNull();
      expect(tournament.registrations.length).toBe(0);
      expect(tournament.isDeleted()).toBe(false);
      expect(mockIdGenerator.generate).toHaveBeenCalledTimes(1);
    });

    it('Não deve permitir criar torneio com nome muito curto', () => {
      // Arrange
      const props = { ...validTournamentProps, name: 'AB' };

      // Act & Assert
      expect(() => Tournament.create(props, mockIdGenerator)).toThrow(
        new InvalidOperationException('Tournament name is required and must have at least 3 characters.'),
      );
    });

    it('Não deve permitir criar torneio com nome vazio', () => {
      // Arrange
      const props = { ...validTournamentProps, name: '' };

      // Act & Assert
      expect(() => Tournament.create(props, mockIdGenerator)).toThrow(
        new InvalidOperationException('Tournament name is required and must have at least 3 characters.'),
      );
    });

    it('Não deve permitir criar torneio com descrição muito curta', () => {
      // Arrange
      const props = { ...validTournamentProps, description: 'Desc' };

      // Act & Assert
      expect(() => Tournament.create(props, mockIdGenerator)).toThrow(
        new InvalidOperationException('Tournament description is required and must have at least 10 characters.'),
      );
    });

    it('Não deve permitir criar torneio com descrição vazia', () => {
      // Arrange
      const props = { ...validTournamentProps, description: '' };

      // Act & Assert
      expect(() => Tournament.create(props, mockIdGenerator)).toThrow(
        new InvalidOperationException('Tournament description is required and must have at least 10 characters.'),
      );
    });

    it('Não deve permitir que a data final de inscrição seja anterior à data inicial', () => {
      // Arrange
      const props = {
        ...validTournamentProps,
        registrationStartDate: new Date('2024-01-15'),
        registrationEndDate: new Date('2024-01-10'),
      };

      // Act & Assert
      expect(() => Tournament.create(props, mockIdGenerator)).toThrow(
        new InvalidOperationException('Registration end date cannot be before or equal to the start date.'),
      );
    });

    it('Não deve permitir que a data final de inscrição seja igual à data inicial', () => {
      // Arrange
      const sameDate = new Date('2024-01-15');
      const props = {
        ...validTournamentProps,
        registrationStartDate: sameDate,
        registrationEndDate: sameDate,
      };

      // Act & Assert
      expect(() => Tournament.create(props, mockIdGenerator)).toThrow(
        new InvalidOperationException('Registration end date cannot be before or equal to the start date.'),
      );
    });

    it('Não deve permitir que a data de início do torneio seja antes do fim das inscrições', () => {
      // Arrange
      const props = {
        ...validTournamentProps,
        registrationEndDate: new Date('2024-01-20'),
        startDate: new Date('2024-01-15'),
      };

      // Act & Assert
      expect(() => Tournament.create(props, mockIdGenerator)).toThrow(
        new InvalidOperationException('Tournament start date cannot be before registration end date.'),
      );
    });
  });

  describe('Update', () => {
    it('Deve atualizar propriedades do torneio corretamente', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);
      const updateProps = {
        name: 'Torneio Atualizado',
        description: 'Nova descrição do torneio com mais detalhes',
        type: TournamentType.DUO,
      };

      // Act
      tournament.update(updateProps);

      // Assert
      expect(tournament.name).toBe(updateProps.name);
      expect(tournament.description).toBe(updateProps.description);
      expect(tournament.type).toBe(updateProps.type);
    });

    it('Deve atualizar apenas as propriedades fornecidas', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);
      const originalName = tournament.name;
      const newDescription = 'Nova descrição atualizada com informações completas';

      // Act
      tournament.update({ description: newDescription });

      // Assert
      expect(tournament.name).toBe(originalName);
      expect(tournament.description).toBe(newDescription);
    });

    it('Não deve permitir a atualização de um torneio que já possui inscrições', () => {
      // Arrange
      const tournament = new Tournament({
        id: 'test-id',
        name: validTournamentProps.name,
        description: validTournamentProps.description,
        type: validTournamentProps.type,
        registrationStartDate: validTournamentProps.registrationStartDate,
        registrationEndDate: validTournamentProps.registrationEndDate,
        startDate: validTournamentProps.startDate,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        registrations: new Array(5).fill(null).map(() => ({} as Registration)),
      });

      // Act & Assert
      expect(() => tournament.update({ name: 'Novo Nome' })).toThrow(
        new InvalidOperationException('Cannot update a tournament that already has registrations.'),
      );
    });

    it('Não deve permitir a atualização de um torneio deletado', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);
      tournament.softDelete();

      // Act & Assert
      expect(() => tournament.update({ name: 'Novo Nome' })).toThrow(new InvalidOperationException('Cannot update a deleted tournament.'));
    });

    it('Não deve permitir atualizar com nome inválido', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);

      // Act & Assert
      expect(() => tournament.update({ name: 'AB' })).toThrow(new InvalidOperationException('Tournament name must have at least 3 characters.'));
    });

    it('Não deve permitir atualizar com descrição inválida', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);

      // Act & Assert
      expect(() => tournament.update({ description: 'Desc' })).toThrow(
        new InvalidOperationException('Tournament description must have at least 10 characters.'),
      );
    });

    it('Deve validar datas após atualização', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);

      // Act & Assert
      expect(() =>
        tournament.update({
          registrationStartDate: new Date('2024-01-20'),
          registrationEndDate: new Date('2024-01-15'),
        }),
      ).toThrow(new InvalidOperationException('Registration end date cannot be before or equal to the start date.'));
    });

    it('Deve validar data de início após atualização', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);

      // Act & Assert
      expect(() =>
        tournament.update({
          registrationEndDate: new Date('2024-01-25'),
          startDate: new Date('2024-01-20'),
        }),
      ).toThrow(new InvalidOperationException('Tournament start date cannot be before registration end date.'));
    });
  });

  describe('Soft Delete', () => {
    it('Deve deletar um torneio corretamente', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);

      // Act
      tournament.softDelete();

      // Assert
      expect(tournament.deletedAt).toBeInstanceOf(Date);
      expect(tournament.isDeleted()).toBe(true);
    });

    it('Não deve permitir deletar um torneio que já possui inscrições', () => {
      // Arrange
      const tournament = new Tournament({
        id: 'test-id',
        name: validTournamentProps.name,
        description: validTournamentProps.description,
        type: validTournamentProps.type,
        registrationStartDate: validTournamentProps.registrationStartDate,
        registrationEndDate: validTournamentProps.registrationEndDate,
        startDate: validTournamentProps.startDate,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        registrations: new Array(3).fill(null).map(() => ({} as Registration)),
      });

      // Act & Assert
      expect(() => tournament.softDelete()).toThrow(new InvalidOperationException('Cannot delete a tournament that already has registrations.'));
    });

    it('Não deve permitir deletar um torneio já deletado', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);
      tournament.softDelete();

      // Act & Assert
      expect(() => tournament.softDelete()).toThrow(new InvalidOperationException('Tournament is already deleted.'));
    });
  });

  describe('Getters', () => {
    it('Deve retornar todas as propriedades corretamente', () => {
      // Arrange & Act
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);

      // Assert
      expect(tournament.id).toBeDefined();
      expect(tournament.name).toBe(validTournamentProps.name);
      expect(tournament.description).toBe(validTournamentProps.description);
      expect(tournament.type).toBe(validTournamentProps.type);
      expect(tournament.registrationStartDate).toEqual(validTournamentProps.registrationStartDate);
      expect(tournament.registrationEndDate).toEqual(validTournamentProps.registrationEndDate);
      expect(tournament.startDate).toEqual(validTournamentProps.startDate);
      expect(tournament.deletedAt).toBeNull();
      expect(tournament.createdAt).toBeInstanceOf(Date);
      expect(tournament.updatedAt).toBeInstanceOf(Date);
      expect(tournament.registrations.length).toBe(0);
      expect(tournament.registrations).toEqual([]);
    });
  });

  describe('Individual Registration', () => {
    let openTournament: Tournament;
    let closedTournament: Tournament;
    let duoTournament: Tournament;

    beforeEach(() => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      openTournament = Tournament.create(
        {
          ...validTournamentProps,
          type: TournamentType.INDIVIDUAL,
          registrationStartDate: yesterday,
          registrationEndDate: tomorrow,
          startDate: nextWeek,
        },
        mockIdGenerator,
      );

      closedTournament = Tournament.create(
        {
          ...validTournamentProps,
          type: TournamentType.INDIVIDUAL,
          registrationStartDate: new Date('2024-01-01'),
          registrationEndDate: new Date('2024-01-15'),
          startDate: new Date('2024-02-01'),
        },
        mockIdGenerator,
      );

      duoTournament = Tournament.create(
        {
          ...validTournamentProps,
          type: TournamentType.DUO,
          registrationStartDate: yesterday,
          registrationEndDate: tomorrow,
          startDate: nextWeek,
        },
        mockIdGenerator,
      );
    });

    describe('Success scenarios', () => {
      it('Deve criar um registro individual com sucesso', () => {
        // Act
        const registration = openTournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter);

        // Assert
        expect(registration).toBeInstanceOf(Registration);
        expect(registration.tournamentId).toBe(openTournament.id);
        expect(registration.competitorId).toBe(mockDependant.id);
        expect(registration.status).toBe(RegistrationStatus.CONFIRMED);
        expect(registration.type).toBe(RegistrationType.INDIVIDUAL);
        expect(openTournament.registrations.length).toBe(1);
        expect(openTournament.registrations).toHaveLength(1);
        expect(openTournament.registrations[0]).toBe(registration);
        expect(mockIdGenerator.generate).toHaveBeenCalled();
      });

      it('Deve permitir múltiplas inscrições de competidores diferentes', () => {
        // Arrange
        const anotherDependant: Partial<Dependant> = {
          id: 'dependant-456',
          firstName: 'Maria',
          lastName: 'Santos',
        };

        // Act
        const registration1 = openTournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter);
        const registration2 = openTournament.requestIndividualRegistration(anotherDependant as Dependant, mockIdGenerator, mockEventEmitter);

        // Assert
        expect(openTournament.registrations.length).toBe(2);
        expect(openTournament.registrations).toHaveLength(2);
        expect(registration1.competitorId).toBe(mockDependant.id);
        expect(registration2.competitorId).toBe(anotherDependant.id);
      });
    });

    describe('Tournament type validation', () => {
      it('Não deve criar um registro para um torneio que não seja individual', () => {
        // Act & Assert
        expect(() => duoTournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter)).toThrow(
          new InvalidOperationException('Cannot register for this tournament type. Tournament must be of type INDIVIDUAL.'),
        );
      });
    });

    describe('Registration period validation', () => {
      it('Não deve criar um registro fora do período de inscrição', () => {
        // Act & Assert
        expect(() => closedTournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter)).toThrow(
          new InvalidOperationException('Registration period is not open for this tournament.'),
        );
      });

      it('Deve permitir registro no primeiro dia do período', () => {
        // Arrange
        const now = new Date();
        const tournament = Tournament.create(
          {
            ...validTournamentProps,
            type: TournamentType.INDIVIDUAL,
            registrationStartDate: now,
            registrationEndDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
          mockIdGenerator,
        );

        // Act & Assert
        expect(() => tournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter)).not.toThrow();
      });

      it('Deve permitir registro no último dia do período', () => {
        // Arrange
        const now = new Date();
        const tournament = Tournament.create(
          {
            ...validTournamentProps,
            type: TournamentType.INDIVIDUAL,
            registrationStartDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            registrationEndDate: new Date(now.getTime() + 1000), // 1 second in the future
            startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
          mockIdGenerator,
        );

        // Act & Assert
        expect(() => tournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter)).not.toThrow();
      });
    });

    describe('Duplicate registration validation', () => {
      it('Não deve permitir o mesmo competidor se registrar duas vezes', () => {
        // Arrange
        openTournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter);

        // Act & Assert
        expect(() => openTournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter)).toThrow(
          /Registration/,
        );
      });

      it('Deve verificar duplicatas apenas por ID do competidor', () => {
        // Arrange
        const sameDependantDifferentName: Partial<Dependant> = {
          id: mockDependant.id,
          firstName: 'Diferente',
          lastName: 'Nome',
        };
        openTournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter);

        // Act & Assert
        expect(() =>
          openTournament.requestIndividualRegistration(sameDependantDifferentName as Dependant, mockIdGenerator, mockEventEmitter),
        ).toThrow(/Registration/);
      });
    });

    describe('Tournament state updates', () => {
      it('Deve atualizar o contador de registros após criar registro', () => {
        // Arrange
        const initialCount = openTournament.registrations.length;

        // Act
        openTournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter);

        // Assert
        expect(openTournament.registrations.length).toBe(initialCount + 1);
      });

      it('Deve atualizar a data de modificação após criar registro', () => {
        // Arrange
        const initialUpdatedAt = openTournament.updatedAt;

        // Act (wait a small amount to ensure different timestamp)
        setTimeout(() => {
          openTournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter);
        }, 1);

        // Assert
        expect(openTournament.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime());
      });
    });
  });

  describe('Event Emitter Integration', () => {
    let openTournament: Tournament;

    beforeEach(() => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      openTournament = Tournament.create(
        {
          ...validTournamentProps,
          type: TournamentType.INDIVIDUAL,
          registrationStartDate: yesterday,
          registrationEndDate: tomorrow,
          startDate: nextWeek,
        },
        mockIdGenerator,
      );
    });

    it('Deve emitir evento quando criar registro individual', () => {
      // Act
      const registration = openTournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter);

      // Assert
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(expect.objectContaining({
        eventType: 'Registration.Confirmed',
        payload: expect.objectContaining({
          registrationId: registration.id,
          tournamentId: openTournament.id,
          competitorId: mockDependant.id,
          isDuo: false,
        }),
      }));
    });

    it('Deve emitir eventos para múltiplos registros', () => {
      // Arrange
      const anotherDependant: Partial<Dependant> = {
        id: 'dependant-456',
        firstName: 'Maria',
        lastName: 'Santos',
      };

      // Act
      openTournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter);
      openTournament.requestIndividualRegistration(anotherDependant as Dependant, mockIdGenerator, mockEventEmitter);

      // Assert
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(2);
    });

    it('Não deve emitir evento quando registro falha', () => {
      // Arrange - torneio fechado
      const closedTournament = Tournament.create(
        {
          ...validTournamentProps,
          type: TournamentType.INDIVIDUAL,
          registrationStartDate: new Date('2024-01-01'),
          registrationEndDate: new Date('2024-01-15'),
          startDate: new Date('2024-02-01'),
        },
        mockIdGenerator,
      );

      // Act & Assert
      expect(() => closedTournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter)).toThrow();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('RegistrationSync Integration', () => {
    let openTournament: Tournament;

    beforeEach(() => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      openTournament = Tournament.create(
        {
          ...validTournamentProps,
          type: TournamentType.INDIVIDUAL,
          registrationStartDate: yesterday,
          registrationEndDate: tomorrow,
          startDate: nextWeek,
        },
        mockIdGenerator,
      );
    });

    it('Deve criar RegistrationSync junto com Registration', () => {
      // Act
      const registration = openTournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter);

      // Assert
      expect(registration.sync).toBeDefined();
      expect(registration.sync.registrationId).toBe(registration.id);
      expect(registration.sync.status).toBe('PENDING');
    });

    it('Deve permitir acesso a RegistrationSync via Registration', () => {
      // Act
      const registration = openTournament.requestIndividualRegistration(mockDependant as Dependant, mockIdGenerator, mockEventEmitter);

      // Assert
      expect(registration.sync).toBeDefined();
      expect(registration.sync.status).toBe('PENDING');
      expect(registration.sync.attempts).toBe(0);
    });
  });
});
