import { Test } from '@nestjs/testing';

import { TournamentRepository } from '@/domain/repositories/tournament.repository';
import Tournament from '@/domain/entities/tournament/tournament.entity';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import IdGenerator from '@/application/services/id-generator';

import { TOURNAMENT_REPOSITORY } from '@/shared/constants/repository-constants';
import { ID_GENERATOR } from '@/shared/constants/service-constants';

import { CreateTournament } from './create-tournament.use-case';

describe('(UNIT) CreateTournament', () => {
  let useCase: CreateTournament;
  let tournamentRepository: TournamentRepository;
  let idGenerator: IdGenerator;

  const mockTournamentRepository = {
    save: jest.fn(),
    findById: jest.fn(),
  };

  const mockIdGenerator = {
    generate: jest.fn().mockReturnValue('mock-id-123'),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateTournament,
        { provide: TOURNAMENT_REPOSITORY, useValue: mockTournamentRepository },
        { provide: ID_GENERATOR, useValue: mockIdGenerator },
      ],
    }).compile();

    useCase = moduleRef.get(CreateTournament);
    tournamentRepository = moduleRef.get(TOURNAMENT_REPOSITORY);
    idGenerator = moduleRef.get(ID_GENERATOR);

    jest.clearAllMocks();
  });

  const validTournamentProps = {
    name: 'Torneio Nacional de Debate',
    description: 'Torneio nacional de debate para estudantes do ensino médio com foco em argumentação',
    type: TournamentType.INDIVIDUAL,
    registrationStartDate: new Date('2024-01-01'),
    registrationEndDate: new Date('2024-01-15'),
    startDate: new Date('2024-02-01'),
  };

  it('Deve criar um novo torneio', async () => {
    // Arrange
    mockTournamentRepository.save.mockResolvedValueOnce(undefined);

    // Act
    const result = await useCase.execute(validTournamentProps);

    // Assert
    expect(result).toBeInstanceOf(Tournament);
    expect(result.name).toBe(validTournamentProps.name);
    expect(result.description).toBe(validTournamentProps.description);
    expect(result.type).toBe(validTournamentProps.type);
    expect(result.registrationStartDate).toEqual(validTournamentProps.registrationStartDate);
    expect(result.registrationEndDate).toEqual(validTournamentProps.registrationEndDate);
    expect(result.startDate).toEqual(validTournamentProps.startDate);
    expect(mockIdGenerator.generate).toHaveBeenCalledTimes(1);
    expect(mockTournamentRepository.save).toHaveBeenCalledTimes(1);
    expect(mockTournamentRepository.save).toHaveBeenCalledWith(result);
  });

  it('Deve propagar exceções de validação do domínio', async () => {
    // Arrange
    const invalidProps = {
      ...validTournamentProps,
      name: 'AB', // Nome muito curto
    };

    // Act & Assert
    await expect(useCase.execute(invalidProps)).rejects.toThrow(
      'Tournament name is required and must have at least 3 characters.',
    );
    expect(mockTournamentRepository.save).not.toHaveBeenCalled();
  });

  it('Deve propagar erros do repositório', async () => {
    // Arrange
    const repositoryError = new Error('Database connection failed');
    mockTournamentRepository.save.mockRejectedValueOnce(repositoryError);

    // Act & Assert
    await expect(useCase.execute(validTournamentProps)).rejects.toThrow('Database connection failed');
  });
});