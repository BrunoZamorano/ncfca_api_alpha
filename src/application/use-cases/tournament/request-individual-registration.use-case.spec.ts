import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { RequestIndividualRegistration } from './request-individual-registration.use-case';
import { TournamentRepository } from '@/domain/repositories/tournament.repository';
import FamilyRepository from '@/domain/repositories/family-repository';
import Tournament from '@/domain/entities/tournament/tournament.entity';
import Dependant from '@/domain/entities/dependant/dependant';
import IdGenerator from '@/application/services/id-generator';
import { EntityNotFoundException, OptimisticLockError } from '@/domain/exceptions/domain-exception';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import { DependantType } from '@/domain/enums/dependant-type.enum';
import { Sex } from '@/domain/enums/sex';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';

import { TOURNAMENT_REPOSITORY } from '@/shared/constants/repository-constants';
import { FAMILY_REPOSITORY } from '@/shared/constants/repository-constants';
import { ID_GENERATOR } from '@/shared/constants/service-constants';

describe('RequestIndividualRegistration', () => {
  let useCase: RequestIndividualRegistration;
  let tournamentRepository: jest.Mocked<TournamentRepository>;
  let familyRepository: jest.Mocked<FamilyRepository>;
  let idGenerator: jest.Mocked<IdGenerator>;

  beforeEach(async () => {
    const mockTournamentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    const mockFamilyRepository = {
      findByHolderId: jest.fn(),
      findDependant: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findAll: jest.fn(),
    };

    const mockIdGenerator = {
      generate: jest.fn().mockReturnValue('test-id'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestIndividualRegistration,
        {
          provide: TOURNAMENT_REPOSITORY,
          useValue: mockTournamentRepository,
        },
        {
          provide: FAMILY_REPOSITORY,
          useValue: mockFamilyRepository,
        },
        {
          provide: ID_GENERATOR,
          useValue: mockIdGenerator,
        },
      ],
    }).compile();

    useCase = module.get<RequestIndividualRegistration>(RequestIndividualRegistration);
    tournamentRepository = module.get(TOURNAMENT_REPOSITORY);
    familyRepository = module.get(FAMILY_REPOSITORY);
    idGenerator = module.get(ID_GENERATOR);
  });

  describe('execute', () => {
    const tournamentId = 'tournament-id';
    const competitorId = 'competitor-id';

    it('deveria criar uma inscrição individual com sucesso', async () => {
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

      tournamentRepository.findById.mockResolvedValue(tournament);
      familyRepository.findDependant.mockResolvedValue(competitor);
      tournamentRepository.save.mockResolvedValue();

      const result = await useCase.execute({ tournamentId, competitorId });

      expect(tournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
      expect(familyRepository.findDependant).toHaveBeenCalledWith(competitorId);
      expect(tournamentRepository.save).toHaveBeenCalledWith(tournament);
      expect(result.competitorId).toBe(competitorId);
      expect(result.tournamentId).toBe(tournamentId);
    });

    it('deveria lançar EntityNotFoundException quando o torneio não for encontrado', async () => {
      tournamentRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute({ tournamentId, competitorId })).rejects.toThrow(new EntityNotFoundException('Tournament', tournamentId));

      expect(tournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
      expect(familyRepository.findDependant).not.toHaveBeenCalled();
      expect(tournamentRepository.save).not.toHaveBeenCalled();
    });

    it('deveria lançar EntityNotFoundException quando o dependente não for encontrado', async () => {
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

      tournamentRepository.findById.mockResolvedValue(tournament);
      familyRepository.findDependant.mockResolvedValue(null);

      await expect(useCase.execute({ tournamentId, competitorId })).rejects.toThrow(new EntityNotFoundException('Dependant', competitorId));

      expect(tournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
      expect(familyRepository.findDependant).toHaveBeenCalledWith(competitorId);
      expect(tournamentRepository.save).not.toHaveBeenCalled();
    });

    it('deveria lançar ConflictException quando ocorrer OptimisticLockError', async () => {
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

      tournamentRepository.findById.mockResolvedValue(tournament);
      familyRepository.findDependant.mockResolvedValue(competitor);
      tournamentRepository.save.mockRejectedValue(new OptimisticLockError('Tournament', tournamentId));

      await expect(useCase.execute({ tournamentId, competitorId })).rejects.toThrow(
        new ConflictException('Tournament has been modified by another process. Please refresh and try again.'),
      );

      expect(tournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
      expect(familyRepository.findDependant).toHaveBeenCalledWith(competitorId);
      expect(tournamentRepository.save).toHaveBeenCalledWith(tournament);
    });

    it('deveria propagar outros erros do repositório', async () => {
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

      const databaseError = new Error('Database connection failed');

      tournamentRepository.findById.mockResolvedValue(tournament);
      familyRepository.findDependant.mockResolvedValue(competitor);
      tournamentRepository.save.mockRejectedValue(databaseError);

      await expect(useCase.execute({ tournamentId, competitorId })).rejects.toThrow(databaseError);

      expect(tournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
      expect(familyRepository.findDependant).toHaveBeenCalledWith(competitorId);
      expect(tournamentRepository.save).toHaveBeenCalledWith(tournament);
    });
  });
});
