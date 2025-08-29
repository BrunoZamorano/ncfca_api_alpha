import Registration from './registration.entity';
import { RegistrationStatus } from '@/domain/enums/registration-status.enum';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import IdGenerator from '@/application/services/id-generator';
import RegistrationSync from './registration-sync.entity';

const mockIdGenerator: IdGenerator = {
  generate: jest.fn().mockImplementation(() => `mock-uuid-${Math.random()}`),
};

// Mock RegistrationSync.create
jest.mock('./registration-sync.entity', () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockReturnValue({
      id: 'sync-123',
      registrationId: 'registration-123',
      status: 'PENDING',
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },
}));

describe('(UNIT) Registration Entity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Factory Methods', () => {
    describe('createForTournament', () => {
      it('Deve criar um registro individual com sucesso', () => {
        // Arrange
        const tournamentId = 'tournament-123';
        const competitorId = 'competitor-123';

        // Act
        const registration = Registration.createForTournament(tournamentId, competitorId, mockIdGenerator);

        // Assert
        expect(registration).toBeInstanceOf(Registration);
        expect(registration.tournamentId).toBe(tournamentId);
        expect(registration.competitorId).toBe(competitorId);
        expect(registration.partnerId).toBeNull();
        expect(registration.status).toBe(RegistrationStatus.CONFIRMED);
        expect(registration.type).toBe(TournamentType.INDIVIDUAL);
        expect(registration.version).toBe(1);
        expect(registration.createdAt).toBeInstanceOf(Date);
        expect(registration.updatedAt).toBeInstanceOf(Date);
        expect(registration.sync).toBeDefined();
        expect(mockIdGenerator.generate).toHaveBeenCalledTimes(1);
      });

      it('Deve gerar ID único para cada registro', () => {
        // Arrange
        const tournamentId = 'tournament-123';
        const competitorId = 'competitor-123';

        // Act
        const registration1 = Registration.createForTournament(tournamentId, competitorId, mockIdGenerator);
        const registration2 = Registration.createForTournament(tournamentId, competitorId, mockIdGenerator);

        // Assert
        expect(registration1.id).toBeDefined();
        expect(registration2.id).toBeDefined();
        expect(registration1.id).not.toBe(registration2.id);
      });
    });

    describe('createDuoRegistrationForTournament', () => {
      it('Deve criar um registro de dupla com sucesso', () => {
        // Arrange
        const tournamentId = 'tournament-123';
        const competitorId = 'competitor-123';
        const partnerId = 'partner-456';

        // Act
        const registration = Registration.createDuoRegistrationForTournament(tournamentId, competitorId, partnerId, mockIdGenerator);

        // Assert
        expect(registration).toBeInstanceOf(Registration);
        expect(registration.tournamentId).toBe(tournamentId);
        expect(registration.competitorId).toBe(competitorId);
        expect(registration.partnerId).toBe(partnerId);
        expect(registration.status).toBe(RegistrationStatus.PENDING_APPROVAL);
        expect(registration.type).toBe(TournamentType.DUO);
        expect(registration.version).toBe(1);
        expect(registration.createdAt).toBeInstanceOf(Date);
        expect(registration.updatedAt).toBeInstanceOf(Date);
        expect(registration.sync).toBeDefined();
        expect(mockIdGenerator.generate).toHaveBeenCalledTimes(1);
      });

      it('Deve gerar ID único para cada registro de dupla', () => {
        // Arrange
        const tournamentId = 'tournament-123';
        const competitorId = 'competitor-123';
        const partnerId = 'partner-456';

        // Act
        const registration1 = Registration.createDuoRegistrationForTournament(tournamentId, competitorId, partnerId, mockIdGenerator);
        const registration2 = Registration.createDuoRegistrationForTournament(tournamentId, competitorId, partnerId, mockIdGenerator);

        // Assert
        expect(registration1.id).toBeDefined();
        expect(registration2.id).toBeDefined();
        expect(registration1.id).not.toBe(registration2.id);
      });
    });

    describe('fromPersistence', () => {
      it('Deve reconstruir registro a partir de dados persistidos', () => {
        // Arrange
        const props = {
          id: 'registration-123',
          status: RegistrationStatus.CONFIRMED,
          type: TournamentType.INDIVIDUAL,
          version: 2,
          sync: {
            id: 'sync-123',
            registrationId: 'registration-123',
            status: 'PENDING',
            attempts: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as RegistrationSync,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          tournamentId: 'tournament-123',
          competitorId: 'competitor-123',
        };

        // Act
        const registration = Registration.fromPersistence(props);

        // Assert
        expect(registration).toBeInstanceOf(Registration);
        expect(registration.id).toBe(props.id);
        expect(registration.status).toBe(props.status);
        expect(registration.type).toBe(props.type);
        expect(registration.version).toBe(props.version);
        expect(registration.tournamentId).toBe(props.tournamentId);
        expect(registration.competitorId).toBe(props.competitorId);
        expect(registration.partnerId).toBeNull();
        expect(registration.createdAt).toBe(props.createdAt);
        expect(registration.updatedAt).toBe(props.updatedAt);
        expect(registration.sync).toBe(props.sync);
      });

      it('Deve reconstruir registro de dupla com partnerId', () => {
        // Arrange
        const props = {
          id: 'registration-123',
          status: RegistrationStatus.PENDING_APPROVAL,
          type: TournamentType.DUO,
          partnerId: 'partner-456',
          version: 1,
          sync: {
            id: 'sync-123',
            registrationId: 'registration-123',
            status: 'PENDING',
            attempts: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as RegistrationSync,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          tournamentId: 'tournament-123',
          competitorId: 'competitor-123',
        };

        // Act
        const registration = Registration.fromPersistence(props);

        // Assert
        expect(registration.partnerId).toBe(props.partnerId);
        expect(registration.type).toBe(TournamentType.DUO);
        expect(registration.status).toBe(RegistrationStatus.PENDING_APPROVAL);
      });
    });
  });

  describe('State Management', () => {
    describe('cancel', () => {
      it('Deve cancelar um registro confirmado', () => {
        // Arrange
        const registration = Registration.createForTournament('tournament-123', 'competitor-123', mockIdGenerator);
        const initialUpdatedAt = registration.updatedAt;

        // Act
        registration.cancel();

        // Assert
        expect(registration.status).toBe(RegistrationStatus.CANCELLED);
        expect(registration.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime());
      });

      it('Deve cancelar um registro pendente', () => {
        // Arrange
        const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);

        // Act
        registration.cancel();

        // Assert
        expect(registration.status).toBe(RegistrationStatus.CANCELLED);
      });

      it('Não deve cancelar um registro já cancelado', () => {
        // Arrange
        const registration = Registration.createForTournament('tournament-123', 'competitor-123', mockIdGenerator);
        registration.cancel();

        // Act & Assert
        expect(() => registration.cancel()).toThrow('Registration is already cancelled');
      });
    });

    describe('confirm', () => {
      it('Deve confirmar um registro pendente', () => {
        // Arrange
        const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);
        const initialVersion = registration.version;
        const initialUpdatedAt = registration.updatedAt;

        // Act
        registration.confirm();

        // Assert
        expect(registration.status).toBe(RegistrationStatus.CONFIRMED);
        expect(registration.version).toBe(initialVersion + 1);
        expect(registration.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime());
      });

      it('Não deve confirmar um registro já confirmado', () => {
        // Arrange
        const registration = Registration.createForTournament('tournament-123', 'competitor-123', mockIdGenerator);

        // Act & Assert
        expect(() => registration.confirm()).toThrow('Registration must be pending approval to be confirmed');
      });

      it('Não deve confirmar um registro cancelado', () => {
        // Arrange
        const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);
        registration.cancel();

        // Act & Assert
        expect(() => registration.confirm()).toThrow('Registration must be pending approval to be confirmed');
      });

      it('Não deve confirmar um registro rejeitado', () => {
        // Arrange
        const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);
        registration.reject();

        // Act & Assert
        expect(() => registration.confirm()).toThrow('Registration must be pending approval to be confirmed');
      });
    });

    describe('reject', () => {
      it('Deve rejeitar um registro pendente', () => {
        // Arrange
        const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);
        const initialVersion = registration.version;
        const initialUpdatedAt = registration.updatedAt;

        // Act
        registration.reject();

        // Assert
        expect(registration.status).toBe(RegistrationStatus.REJECTED);
        expect(registration.version).toBe(initialVersion + 1);
        expect(registration.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime());
      });

      it('Não deve rejeitar um registro já confirmado', () => {
        // Arrange
        const registration = Registration.createForTournament('tournament-123', 'competitor-123', mockIdGenerator);

        // Act & Assert
        expect(() => registration.reject()).toThrow('Registration must be pending approval to be rejected');
      });

      it('Não deve rejeitar um registro cancelado', () => {
        // Arrange
        const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);
        registration.cancel();

        // Act & Assert
        expect(() => registration.reject()).toThrow('Registration must be pending approval to be rejected');
      });

      it('Não deve rejeitar um registro já rejeitado', () => {
        // Arrange
        const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);
        registration.reject();

        // Act & Assert
        expect(() => registration.reject()).toThrow('Registration must be pending approval to be rejected');
      });
    });
  });

  describe('Query Methods', () => {
    describe('isConfirmed', () => {
      it('Deve retornar true para registro confirmado', () => {
        // Arrange
        const registration = Registration.createForTournament('tournament-123', 'competitor-123', mockIdGenerator);

        // Act & Assert
        expect(registration.isConfirmed()).toBe(true);
      });

      it('Deve retornar false para registro pendente', () => {
        // Arrange
        const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);

        // Act & Assert
        expect(registration.isConfirmed()).toBe(false);
      });

      it('Deve retornar false para registro cancelado', () => {
        // Arrange
        const registration = Registration.createForTournament('tournament-123', 'competitor-123', mockIdGenerator);
        registration.cancel();

        // Act & Assert
        expect(registration.isConfirmed()).toBe(false);
      });

      it('Deve retornar false para registro rejeitado', () => {
        // Arrange
        const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);
        registration.reject();

        // Act & Assert
        expect(registration.isConfirmed()).toBe(false);
      });

      it('Deve retornar true após confirmação de registro pendente', () => {
        // Arrange
        const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);

        // Act
        registration.confirm();

        // Assert
        expect(registration.isConfirmed()).toBe(true);
      });
    });
  });

  describe('Getters', () => {
    it('Deve retornar todas as propriedades corretamente', () => {
      // Arrange & Act
      const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);

      // Assert
      expect(registration.id).toBeDefined();
      expect(registration.tournamentId).toBe('tournament-123');
      expect(registration.competitorId).toBe('competitor-123');
      expect(registration.partnerId).toBe('partner-456');
      expect(registration.status).toBe(RegistrationStatus.PENDING_APPROVAL);
      expect(registration.type).toBe(TournamentType.DUO);
      expect(registration.version).toBe(1);
      expect(registration.createdAt).toBeInstanceOf(Date);
      expect(registration.updatedAt).toBeInstanceOf(Date);
      expect(registration.sync).toBeDefined();
    });

    it('Deve retornar partnerId como null para registro individual', () => {
      // Arrange & Act
      const registration = Registration.createForTournament('tournament-123', 'competitor-123', mockIdGenerator);

      // Assert
      expect(registration.partnerId).toBeNull();
      expect(registration.type).toBe(TournamentType.INDIVIDUAL);
    });
  });

  describe('Version Control', () => {
    it('Deve incrementar version ao confirmar', () => {
      // Arrange
      const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);
      const initialVersion = registration.version;

      // Act
      registration.confirm();

      // Assert
      expect(registration.version).toBe(initialVersion + 1);
    });

    it('Deve incrementar version ao rejeitar', () => {
      // Arrange
      const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);
      const initialVersion = registration.version;

      // Act
      registration.reject();

      // Assert
      expect(registration.version).toBe(initialVersion + 1);
    });

    it('Não deve incrementar version ao cancelar', () => {
      // Arrange
      const registration = Registration.createForTournament('tournament-123', 'competitor-123', mockIdGenerator);
      const initialVersion = registration.version;

      // Act
      registration.cancel();

      // Assert
      expect(registration.version).toBe(initialVersion);
    });
  });

  describe('Timestamp Management', () => {
    it('Deve atualizar updatedAt ao confirmar', () => {
      // Arrange
      const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);
      const initialUpdatedAt = registration.updatedAt;

      // Act
      setTimeout(() => registration.confirm(), 1);

      // Assert
      expect(registration.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime());
    });

    it('Deve atualizar updatedAt ao rejeitar', () => {
      // Arrange
      const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);
      const initialUpdatedAt = registration.updatedAt;

      // Act
      setTimeout(() => registration.reject(), 1);

      // Assert
      expect(registration.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime());
    });

    it('Deve atualizar updatedAt ao cancelar', () => {
      // Arrange
      const registration = Registration.createForTournament('tournament-123', 'competitor-123', mockIdGenerator);
      const initialUpdatedAt = registration.updatedAt;

      // Act
      setTimeout(() => registration.cancel(), 1);

      // Assert
      expect(registration.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime());
    });

    it('Não deve alterar createdAt durante operações', () => {
      // Arrange
      const registration = Registration.createDuoRegistrationForTournament('tournament-123', 'competitor-123', 'partner-456', mockIdGenerator);
      const initialCreatedAt = registration.createdAt;

      // Act
      registration.confirm();
      registration.cancel();

      // Assert
      expect(registration.createdAt).toBe(initialCreatedAt);
    });
  });
});
