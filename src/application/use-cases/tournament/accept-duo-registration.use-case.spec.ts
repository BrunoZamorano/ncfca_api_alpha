import { Test, TestingModule } from '@nestjs/testing';

/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { UnitOfWork, UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import Tournament from '@/domain/entities/tournament/tournament.entity';
import Registration from '@/domain/entities/registration/registration.entity';
import RegistrationSync, { SyncStatus } from '@/domain/entities/registration/registration-sync.entity';
import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import { RegistrationStatus } from '@/domain/enums/registration-status.enum';
import IdGenerator from '@/application/services/id-generator';

import { ID_GENERATOR } from '@/shared/constants/service-constants';
import { EVENT_EMITTER_FACADE } from '@/shared/constants/event.constants';
import { EventEmitterFacade } from '@/domain/events/event-emitter';

import { AcceptDuoRegistration } from './accept-duo-registration.use-case';

describe('(UNIT) AcceptDuoRegistration', () => {
  let useCase: AcceptDuoRegistration;
  let mockUnitOfWork: jest.Mocked<UnitOfWork>;
  let mockEventEmitterFacade: jest.Mocked<EventEmitterFacade>;
  let idGenerator: jest.Mocked<IdGenerator>;

  beforeEach(async () => {
    const mockTournamentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByRegistrationId: jest.fn(),
    };

    idGenerator = {
      generate: jest.fn().mockReturnValue('test-id'),
    };

    mockEventEmitterFacade = {
      tournamentEmitter: {
        emit: jest.fn(),
      },
      clubEmitter: {
        emit: jest.fn(),
      },
    } as unknown as jest.Mocked<EventEmitterFacade>;

    mockUnitOfWork = {
      tournamentRepository: mockTournamentRepository,
      executeInTransaction: jest.fn().mockImplementation(async (work) => await work()),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptDuoRegistration,
        {
          provide: UNIT_OF_WORK,
          useValue: mockUnitOfWork,
        },
        {
          provide: ID_GENERATOR,
          useValue: idGenerator,
        },
        {
          provide: EVENT_EMITTER_FACADE,
          useValue: mockEventEmitterFacade,
        },
      ],
    }).compile();

    useCase = module.get<AcceptDuoRegistration>(AcceptDuoRegistration);
  });

  describe('execute', () => {
    const registrationId = 'registration-id';
    const userId = 'user-id';
    const tournamentId = 'tournament-id';
    const competitorId = 'competitor-id';
    const partnerId = 'partner-id';

    const createRegistrationSync = () =>
      new RegistrationSync({
        id: 'sync-id',
        registrationId,
        status: SyncStatus.PENDING,
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAttemptAt: null,
        nextAttemptAt: null,
      });

    const createRegistration = (status: RegistrationStatus = RegistrationStatus.PENDING_APPROVAL) =>
      Registration.fromPersistence({
        id: registrationId,
        tournamentId,
        competitorId,
        partnerId,
        status,
        type: TournamentType.DUO,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        sync: createRegistrationSync(),
      });

    const createTournament = (registrations?: Registration[], overrides?: any) =>
      new Tournament({
        id: tournamentId,
        name: 'Test Tournament',
        description: 'Test description for tournament',
        type: TournamentType.DUO,
        registrationStartDate: new Date(Date.now() - 86400000), // ontem
        registrationEndDate: new Date(Date.now() + 86400000), // amanhã
        startDate: new Date('2025-01-15'),
        deletedAt: null,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        registrations: registrations || [],
        ...overrides,
      });

    it('Deve aceitar uma inscrição de dupla com sucesso', async () => {
      const registration = createRegistration();
      const tournament = createTournament([registration]);

      (mockUnitOfWork.tournamentRepository.findByRegistrationId as jest.Mock).mockResolvedValue(tournament);
      (mockUnitOfWork.tournamentRepository.save as jest.Mock).mockResolvedValue(undefined);

      await useCase.execute({ registrationId, userId });

      expect(mockUnitOfWork.executeInTransaction).toHaveBeenCalled();
      expect(mockUnitOfWork.tournamentRepository.findByRegistrationId).toHaveBeenCalledWith(registrationId);
      expect(mockUnitOfWork.tournamentRepository.save).toHaveBeenCalledWith(tournament);
      expect(mockEventEmitterFacade.tournamentEmitter.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'DuoRegistration.Accepted',
          payload: expect.objectContaining({
            registrationId,
            tournamentId,
            competitorId,
            partnerId,
          }),
        }),
      );
    });

    it('Deve cancelar inscrição quando torneio estiver lotado', async () => {
      const registration = createRegistration();
      const confirmedRegistrations = Array.from({ length: 10 }, (_, i) =>
        Registration.fromPersistence({
          id: `reg-${i}`,
          tournamentId,
          competitorId: `comp-${i}`,
          partnerId: `partner-${i}`,
          status: RegistrationStatus.CONFIRMED,
          type: TournamentType.DUO,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          sync: createRegistrationSync(),
        }),
      );

      const tournament = createTournament([...confirmedRegistrations, registration]);

      (mockUnitOfWork.tournamentRepository.findByRegistrationId as jest.Mock).mockResolvedValue(tournament);
      (mockUnitOfWork.tournamentRepository.save as jest.Mock).mockResolvedValue(undefined);

      await useCase.execute({ registrationId, userId });

      expect(mockUnitOfWork.executeInTransaction).toHaveBeenCalled();
      expect(mockUnitOfWork.tournamentRepository.findByRegistrationId).toHaveBeenCalledWith(registrationId);
      expect(mockUnitOfWork.tournamentRepository.save).toHaveBeenCalledWith(tournament);
      expect(registration.status).toBe(RegistrationStatus.CANCELLED);
      expect(mockEventEmitterFacade.tournamentEmitter.emit).not.toHaveBeenCalled();
    });

    it('Deve lançar EntityNotFoundException quando torneio não for encontrado', async () => {
      (mockUnitOfWork.tournamentRepository.findByRegistrationId as jest.Mock).mockResolvedValue(null);

      await expect(useCase.execute({ registrationId, userId })).rejects.toThrow(
        new EntityNotFoundException('Tournament', `with registration ${registrationId}`),
      );

      expect(mockUnitOfWork.tournamentRepository.findByRegistrationId).toHaveBeenCalledWith(registrationId);
      expect(mockUnitOfWork.tournamentRepository.save).not.toHaveBeenCalled();
    });

    it('Deve lançar InvalidOperationException quando registro não for encontrado no torneio', async () => {
      const tournament = createTournament([]); // torneio sem registros

      (mockUnitOfWork.tournamentRepository.findByRegistrationId as jest.Mock).mockResolvedValue(tournament);

      await expect(useCase.execute({ registrationId, userId })).rejects.toThrow(
        new InvalidOperationException(`Registration with ID ${registrationId} not found in this tournament.`),
      );

      expect(mockUnitOfWork.tournamentRepository.findByRegistrationId).toHaveBeenCalledWith(registrationId);
      expect(mockUnitOfWork.tournamentRepository.save).not.toHaveBeenCalled();
    });

    it('Deve lançar InvalidOperationException quando registro não está pendente de aprovação', async () => {
      const registration = createRegistration(RegistrationStatus.CONFIRMED);
      const tournament = createTournament([registration]);

      (mockUnitOfWork.tournamentRepository.findByRegistrationId as jest.Mock).mockResolvedValue(tournament);

      await expect(useCase.execute({ registrationId, userId })).rejects.toThrow(
        new InvalidOperationException('Registration is not pending approval.'),
      );

      expect(mockUnitOfWork.tournamentRepository.findByRegistrationId).toHaveBeenCalledWith(registrationId);
      expect(mockUnitOfWork.tournamentRepository.save).not.toHaveBeenCalled();
    });

    it('Deve lançar InvalidOperationException quando torneio estiver deletado', async () => {
      const registration = createRegistration();
      const tournament = createTournament([registration], { deletedAt: new Date() });

      (mockUnitOfWork.tournamentRepository.findByRegistrationId as jest.Mock).mockResolvedValue(tournament);

      await expect(useCase.execute({ registrationId, userId })).rejects.toThrow(
        new InvalidOperationException('Cannot perform operations on a deleted tournament.'),
      );

      expect(mockUnitOfWork.tournamentRepository.findByRegistrationId).toHaveBeenCalledWith(registrationId);
      expect(mockUnitOfWork.tournamentRepository.save).not.toHaveBeenCalled();
    });

    it('Deve manter a versão do torneio para travamento otimista', async () => {
      const registration = createRegistration();
      const initialVersion = 5;
      const tournament = createTournament([registration], { version: initialVersion });

      (mockUnitOfWork.tournamentRepository.findByRegistrationId as jest.Mock).mockResolvedValue(tournament);
      (mockUnitOfWork.tournamentRepository.save as jest.Mock).mockResolvedValue(undefined);

      await useCase.execute({ registrationId, userId });

      expect(tournament.version).toBe(initialVersion + 1);
      expect(mockUnitOfWork.tournamentRepository.save).toHaveBeenCalledWith(tournament);
    });

    it('Deve executar dentro de transação para consistência de dados', async () => {
      const registration = createRegistration();
      const tournament = createTournament([registration]);

      (mockUnitOfWork.tournamentRepository.findByRegistrationId as jest.Mock).mockResolvedValue(tournament);
      (mockUnitOfWork.tournamentRepository.save as jest.Mock).mockResolvedValue(undefined);

      await useCase.execute({ registrationId, userId });

      expect(mockUnitOfWork.executeInTransaction).toHaveBeenCalledWith(expect.any(Function));
    });

    it('Deve propagar erro quando repositório falhar', async () => {
      const registration = createRegistration();
      const tournament = createTournament([registration]);
      const repositoryError = new Error('Database connection failed');

      (mockUnitOfWork.tournamentRepository.findByRegistrationId as jest.Mock).mockResolvedValue(tournament);
      (mockUnitOfWork.tournamentRepository.save as jest.Mock).mockRejectedValue(repositoryError);

      await expect(useCase.execute({ registrationId, userId })).rejects.toThrow(repositoryError);

      expect(mockUnitOfWork.tournamentRepository.findByRegistrationId).toHaveBeenCalledWith(registrationId);
      expect(mockUnitOfWork.tournamentRepository.save).toHaveBeenCalledWith(tournament);
    });
  });
});
