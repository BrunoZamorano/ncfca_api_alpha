import { Test, TestingModule } from '@nestjs/testing';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { ConfirmDuoRegistration } from './confirm-duo-registration.use-case';
import { UnitOfWork, UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import { EventEmitterFacade } from '@/domain/events/event-emitter';
import { EVENT_EMITTER_FACADE } from '@/shared/constants/event.constants';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';

describe('ConfirmDuoRegistration', () => {
  let useCase: ConfirmDuoRegistration;
  let mockUnitOfWork: any;
  let mockEventEmitterFacade: any;

  beforeEach(async () => {
    const mockTournamentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByRegistrationId: jest.fn(),
    } as any;

    mockEventEmitterFacade = {
      tournamentEmitter: {
        emit: jest.fn(),
      },
      clubEmitter: {
        emit: jest.fn(),
      },
    } as unknown as jest.Mocked<EventEmitterFacade>;

    mockUnitOfWork = {
      executeInTransaction: jest.fn(),
      tournamentRepository: mockTournamentRepository,
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmDuoRegistration,
        {
          provide: UNIT_OF_WORK,
          useValue: mockUnitOfWork,
        },
        {
          provide: EVENT_EMITTER_FACADE,
          useValue: mockEventEmitterFacade,
        },
      ],
    }).compile();

    useCase = module.get<ConfirmDuoRegistration>(ConfirmDuoRegistration);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const command = {
      registrationId: 'registration-123',
      tournamentId: 'tournament-123',
      competitorId: 'competitor-123',
      partnerId: 'partner-123',
    };

    it('should throw EntityNotFoundException when tournament is not found', async () => {
      mockUnitOfWork.tournamentRepository.findByRegistrationId.mockResolvedValue(null);
      mockUnitOfWork.executeInTransaction.mockImplementation(async (callback: () => any) => await callback());

      await expect(useCase.execute(command)).rejects.toThrow(
        new EntityNotFoundException('Tournament', `with registration ${command.registrationId}`),
      );
    });

    it('should confirm duo registration and emit RegistrationConfirmed event', async () => {
      const mockTournament = {
        id: command.tournamentId,
        confirmDuoRegistration: jest.fn(),
      } as any;

      mockUnitOfWork.tournamentRepository.findByRegistrationId.mockResolvedValue(mockTournament);
      mockUnitOfWork.executeInTransaction.mockImplementation(async (callback: () => any) => await callback());

      await useCase.execute(command);

      expect(mockTournament.confirmDuoRegistration).toHaveBeenCalledWith(command.registrationId, mockEventEmitterFacade.tournamentEmitter);
      expect(mockUnitOfWork.tournamentRepository.save).toHaveBeenCalledWith(mockTournament);
    });

    it('should execute within a transaction', async () => {
      const mockTournament = {
        id: command.tournamentId,
        confirmDuoRegistration: jest.fn(),
      } as any;

      mockUnitOfWork.tournamentRepository.findByRegistrationId.mockResolvedValue(mockTournament);
      mockUnitOfWork.executeInTransaction.mockImplementation(async (callback: () => any) => await callback());

      await useCase.execute(command);

      expect(mockUnitOfWork.executeInTransaction).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});
