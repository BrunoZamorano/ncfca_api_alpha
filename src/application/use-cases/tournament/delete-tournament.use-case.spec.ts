import { Test } from '@nestjs/testing';

import { TournamentRepository } from '@/domain/repositories/tournament.repository';
import Tournament from '@/domain/entities/tournament/tournament.entity';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import IdGenerator from '@/application/services/id-generator';

import { TOURNAMENT_REPOSITORY } from '@/shared/constants/repository-constants';
import { ID_GENERATOR } from '@/shared/constants/service-constants';

import { DeleteTournament } from './delete-tournament.use-case';

describe('(UNIT) DeleteTournament', () => {
  let useCase: DeleteTournament;
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
        DeleteTournament,
        { provide: TOURNAMENT_REPOSITORY, useValue: mockTournamentRepository },
        { provide: ID_GENERATOR, useValue: mockIdGenerator },
      ],
    }).compile();

    useCase = moduleRef.get(DeleteTournament);
    tournamentRepository = moduleRef.get(TOURNAMENT_REPOSITORY);
    idGenerator = moduleRef.get(ID_GENERATOR);

    jest.clearAllMocks();
  });

  const createMockTournament = (): Tournament => {
    return Tournament.create(
      {
        name: 'Torneio Teste',
        description: 'Descrição do torneio teste com informações completas',
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date('2024-01-01'),
        registrationEndDate: new Date('2024-01-15'),
        startDate: new Date('2024-02-01'),
      },
      idGenerator,
    );
  };

  it('Deve excluir (soft delete) um torneio existente', async () => {
    // Arrange
    const tournamentId = 'tournament-123';
    const existingTournament = createMockTournament();
    const softDeleteSpy = jest.spyOn(existingTournament, 'softDelete');

    mockTournamentRepository.findById.mockResolvedValueOnce(existingTournament);
    mockTournamentRepository.save.mockResolvedValueOnce(undefined);

    // Act
    const result = await useCase.execute(tournamentId);

    // Assert
    expect(result).toBeInstanceOf(Tournament);
    expect(result).toBe(existingTournament);
    expect(softDeleteSpy).toHaveBeenCalledTimes(1);
    expect(mockTournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
    expect(mockTournamentRepository.save).toHaveBeenCalledWith(existingTournament);
  });

  it('Não deve excluir um torneio inexistente', async () => {
    // Arrange
    const tournamentId = 'non-existent-id';

    mockTournamentRepository.findById.mockResolvedValueOnce(null);

    // Act & Assert
    await expect(useCase.execute(tournamentId)).rejects.toThrow(EntityNotFoundException);
    await expect(useCase.execute(tournamentId)).rejects.toThrow(`Tournament with id ${tournamentId} not found.`);
    expect(mockTournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
    expect(mockTournamentRepository.save).not.toHaveBeenCalled();
  });

  it('Deve propagar erros do repositório ao buscar torneio', async () => {
    // Arrange
    const tournamentId = 'tournament-123';
    const repositoryError = new Error('Database connection failed');

    mockTournamentRepository.findById.mockRejectedValueOnce(repositoryError);

    // Act & Assert
    await expect(useCase.execute(tournamentId)).rejects.toThrow('Database connection failed');
    expect(mockTournamentRepository.save).not.toHaveBeenCalled();
  });

  it('Deve propagar erros do repositório ao salvar torneio', async () => {
    // Arrange
    const tournamentId = 'tournament-123';
    const existingTournament = createMockTournament();
    const repositoryError = new Error('Database save failed');

    mockTournamentRepository.findById.mockResolvedValueOnce(existingTournament);
    mockTournamentRepository.save.mockRejectedValueOnce(repositoryError);

    // Act & Assert
    await expect(useCase.execute(tournamentId)).rejects.toThrow('Database save failed');
  });
});