import { Test } from '@nestjs/testing';

import { TournamentRepository } from '@/domain/repositories/tournament.repository';
import Tournament from '@/domain/entities/tournament/tournament.entity';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import IdGenerator from '@/application/services/id-generator';

import { TOURNAMENT_REPOSITORY } from '@/shared/constants/repository-constants';
import { ID_GENERATOR } from '@/shared/constants/service-constants';

import { UpdateTournament, UpdateTournamentInput } from './update-tournament.use-case';

describe('(UNIT) UpdateTournament', () => {
  let useCase: UpdateTournament;
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
        UpdateTournament,
        { provide: TOURNAMENT_REPOSITORY, useValue: mockTournamentRepository },
        { provide: ID_GENERATOR, useValue: mockIdGenerator },
      ],
    }).compile();

    useCase = moduleRef.get(UpdateTournament);
    tournamentRepository = moduleRef.get(TOURNAMENT_REPOSITORY);
    idGenerator = moduleRef.get(ID_GENERATOR);

    jest.clearAllMocks();
  });

  const createMockTournament = (): Tournament => {
    return Tournament.create(
      {
        name: 'Torneio Original',
        description: 'Descrição original do torneio com informações completas',
        type: TournamentType.INDIVIDUAL,
        registrationStartDate: new Date('2024-01-01'),
        registrationEndDate: new Date('2024-01-15'),
        startDate: new Date('2024-02-01'),
      },
      idGenerator,
    );
  };

  it('Deve atualizar um torneio existente', async () => {
    // Arrange
    const tournamentId = 'tournament-123';
    const existingTournament = createMockTournament();
    const updateData = {
      name: 'Torneio Atualizado',
      description: 'Nova descrição do torneio com mais informações detalhadas',
      type: TournamentType.DUO,
    };
    const input: UpdateTournamentInput = { id: tournamentId, data: updateData };

    mockTournamentRepository.findById.mockResolvedValueOnce(existingTournament);
    mockTournamentRepository.save.mockResolvedValueOnce(undefined);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result).toBeInstanceOf(Tournament);
    expect(result.name).toBe(updateData.name);
    expect(result.description).toBe(updateData.description);
    expect(result.type).toBe(updateData.type);
    expect(mockTournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
    expect(mockTournamentRepository.save).toHaveBeenCalledWith(existingTournament);
  });

  it('Deve atualizar apenas as propriedades fornecidas', async () => {
    // Arrange
    const tournamentId = 'tournament-123';
    const existingTournament = createMockTournament();
    const originalName = existingTournament.name;
    const updateData = {
      description: 'Nova descrição parcial com informações atualizadas',
    };
    const input: UpdateTournamentInput = { id: tournamentId, data: updateData };

    mockTournamentRepository.findById.mockResolvedValueOnce(existingTournament);
    mockTournamentRepository.save.mockResolvedValueOnce(undefined);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.name).toBe(originalName);
    expect(result.description).toBe(updateData.description);
    expect(mockTournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
    expect(mockTournamentRepository.save).toHaveBeenCalledWith(existingTournament);
  });

  it('Não deve atualizar um torneio inexistente', async () => {
    // Arrange
    const tournamentId = 'non-existent-id';
    const updateData = { name: 'Torneio Inexistente' };
    const input: UpdateTournamentInput = { id: tournamentId, data: updateData };

    mockTournamentRepository.findById.mockResolvedValueOnce(null);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(EntityNotFoundException);
    await expect(useCase.execute(input)).rejects.toThrow(`Tournament with id ${tournamentId} not found.`);
    expect(mockTournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
    expect(mockTournamentRepository.save).not.toHaveBeenCalled();
  });

  it('Deve propagar exceções de validação do domínio', async () => {
    // Arrange
    const tournamentId = 'tournament-123';
    const existingTournament = createMockTournament();
    const invalidUpdateData = { name: 'AB' }; // Nome muito curto
    const input: UpdateTournamentInput = { id: tournamentId, data: invalidUpdateData };

    mockTournamentRepository.findById.mockResolvedValueOnce(existingTournament);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow('Tournament name must have at least 3 characters.');
    expect(mockTournamentRepository.findById).toHaveBeenCalledWith(tournamentId);
    expect(mockTournamentRepository.save).not.toHaveBeenCalled();
  });

  it('Deve propagar erros do repositório', async () => {
    // Arrange
    const tournamentId = 'tournament-123';
    const existingTournament = createMockTournament();
    const updateData = { name: 'Torneio Atualizado' };
    const input: UpdateTournamentInput = { id: tournamentId, data: updateData };
    const repositoryError = new Error('Database connection failed');

    mockTournamentRepository.findById.mockResolvedValueOnce(existingTournament);
    mockTournamentRepository.save.mockRejectedValueOnce(repositoryError);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow('Database connection failed');
  });
});
