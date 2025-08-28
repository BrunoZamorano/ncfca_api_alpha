import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UnitOfWork, UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import Tournament from '@/domain/entities/tournament/tournament.entity';
import Dependant from '@/domain/entities/dependant/dependant';
import IdGenerator from '@/application/services/id-generator';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import { DependantType } from '@/domain/enums/dependant-type.enum';
import { Sex } from '@/domain/enums/sex';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';

import { ID_GENERATOR } from '@/shared/constants/service-constants';
import { EVENT_EMITTER_FACADE } from '@/shared/constants/event.constants';
import { EventEmitterFacade } from '@/domain/events/event-emitter';
import { RequestIndividualRegistration } from './request-individual-registration.use-case';

describe('(UNIT) RequestIndividualRegistration', () => {
  let useCase: RequestIndividualRegistration;
  let mockUnitOfWork: jest.Mocked<UnitOfWork>;
  let mockEventEmitterFacade: jest.Mocked<EventEmitterFacade>;
  let idGenerator: jest.Mocked<IdGenerator>;

  beforeEach(async () => {
    const mockTournamentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByRegistrationId: jest.fn(),
    };

    const mockFamilyRepository = {
      findByHolderId: jest.fn(),
      findDependant: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findAll: jest.fn(),
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
      familyRepository: mockFamilyRepository,
      executeInTransaction: jest.fn().mockImplementation(async (work) => await work()),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestIndividualRegistration,
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

    useCase = module.get<RequestIndividualRegistration>(RequestIndividualRegistration);
  });

  describe('execute', () => {
    const tournamentId = 'tournament-id';
    const competitorId = 'competitor-id';

    it('Deve criar uma inscrição individual com sucesso', async () => {
      const tournament = new Tournament({
        id: tournamentId,
        name: 'Test Tournament',
        description: 'Test description for tournament',
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date(Date.now() - 86400000), // ontem
        registrationEndDate: new Date(Date.now() + 86400000), // amanhã
        startDate: new Date('2025-01-15'),
        deletedAt: null,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const competitor = new Dependant({
        id: competitorId,
        firstName: 'João',
        lastName: 'Silva',
        familyId: 'family-id',
        relationship: DependantRelationship.SON,
        type: DependantType.STUDENT,
        sex: Sex.MALE,
        birthdate: new Birthdate('2005-01-01'),
      });

      (mockUnitOfWork.tournamentRepository.findById as jest.Mock).mockResolvedValue(tournament);
      (mockUnitOfWork.familyRepository.findDependant as jest.Mock).mockResolvedValue(competitor);
      (mockUnitOfWork.tournamentRepository.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({ tournamentId, competitorId });

      expect(mockUnitOfWork.executeInTransaction).toHaveBeenCalled();
      expect(mockUnitOfWork.tournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
      expect(mockUnitOfWork.familyRepository.findDependant).toHaveBeenCalledWith(competitorId);
      expect(mockUnitOfWork.tournamentRepository.save).toHaveBeenCalledWith(tournament);
      expect(mockEventEmitterFacade.tournamentEmitter.emit).toHaveBeenCalledWith(expect.objectContaining({
        eventType: 'Registration.Confirmed',
        payload: expect.any(Object)
      }));
      expect(result.competitorId).toBe(competitorId);
      expect(result.tournamentId).toBe(tournamentId);
    });

    it('Deve lançar EntityNotFoundException quando o torneio não for encontrado', async () => {
      (mockUnitOfWork.tournamentRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(useCase.execute({ tournamentId, competitorId })).rejects.toThrow(new EntityNotFoundException('Tournament', tournamentId));

      expect(mockUnitOfWork.tournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
      expect(mockUnitOfWork.familyRepository.findDependant).not.toHaveBeenCalled();
      expect(mockUnitOfWork.tournamentRepository.save).not.toHaveBeenCalled();
    });

    it('Deve lançar EntityNotFoundException quando o dependente não for encontrado', async () => {
      const tournament = new Tournament({
        id: tournamentId,
        name: 'Test Tournament',
        description: 'Test description for tournament',
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date(Date.now() - 86400000), // ontem
        registrationEndDate: new Date(Date.now() + 86400000), // amanhã
        startDate: new Date('2025-01-15'),
        deletedAt: null,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (mockUnitOfWork.tournamentRepository.findById as jest.Mock).mockResolvedValue(tournament);
      (mockUnitOfWork.familyRepository.findDependant as jest.Mock).mockResolvedValue(null);

      await expect(useCase.execute({ tournamentId, competitorId })).rejects.toThrow(new EntityNotFoundException('Dependant', competitorId));

      expect(mockUnitOfWork.tournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
      expect(mockUnitOfWork.familyRepository.findDependant).toHaveBeenCalledWith(competitorId);
      expect(mockUnitOfWork.tournamentRepository.save).not.toHaveBeenCalled();
    });

    it('Deve lançar ConflictException quando o competidor já está registrado', async () => {
      const tournament = new Tournament({
        id: tournamentId,
        name: 'Test Tournament',
        description: 'Test description for tournament',
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date(Date.now() - 86400000),
        registrationEndDate: new Date(Date.now() + 86400000),
        startDate: new Date('2025-01-15'),
        deletedAt: null,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        registrations: [{ competitorId } as any],
      });

      const competitor = new Dependant({
        id: competitorId,
        firstName: 'João',
        lastName: 'Silva',
        familyId: 'family-id',
        relationship: DependantRelationship.SON,
        type: DependantType.STUDENT,
        sex: Sex.MALE,
        birthdate: new Birthdate('2005-01-01'),
      });

      (mockUnitOfWork.tournamentRepository.findById as jest.Mock).mockResolvedValue(tournament);
      (mockUnitOfWork.familyRepository.findDependant as jest.Mock).mockResolvedValue(competitor);

      await expect(useCase.execute({ tournamentId, competitorId })).rejects.toThrow(ConflictException);

      expect(mockUnitOfWork.tournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
      expect(mockUnitOfWork.familyRepository.findDependant).toHaveBeenCalledWith(competitorId);
      expect(mockUnitOfWork.tournamentRepository.save).not.toHaveBeenCalled();
    });
  });
});
