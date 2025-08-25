import { Test } from '@nestjs/testing';

import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { TournamentDetailsView } from '@/application/queries/tournament-query/tournament-details.view';
import { QueryService, QUERY_SERVICE } from '@/application/services/query.service';

import { GetTournament } from './get-tournament.use-case';

describe('(UNIT) GetTournament', () => {
  let useCase: GetTournament;
  let queryService: QueryService;

  const mockQueryService = {
    tournamentQuery: {
      findById: jest.fn(),
      search: jest.fn(),
    },
    enrollmentQuery: {},
    dependantQuery: {},
    trainingQuery: {},
    clubQuery: {},
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [GetTournament, { provide: QUERY_SERVICE, useValue: mockQueryService }],
    }).compile();

    useCase = moduleRef.get(GetTournament);
    queryService = moduleRef.get(QUERY_SERVICE);

    jest.clearAllMocks();
  });

  const createMockTournamentDetails = (): TournamentDetailsView => ({
    id: 'tournament-123',
    name: 'Torneio Nacional de Debate',
    description: 'Torneio nacional de debate para estudantes do ensino médio com foco em argumentação',
    type: 'INDIVIDUAL',
    registrationStartDate: new Date('2024-01-01'),
    registrationEndDate: new Date('2024-01-15'),
    startDate: new Date('2024-02-01'),
    registrationCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

  it('Deve retornar os detalhes de um torneio', async () => {
    // Arrange
    const tournamentId = 'tournament-123';
    const mockTournament = createMockTournamentDetails();

    mockQueryService.tournamentQuery.findById.mockResolvedValueOnce(mockTournament);

    // Act
    const result = await useCase.execute(tournamentId);

    // Assert
    expect(result).toEqual(mockTournament);
    expect(mockQueryService.tournamentQuery.findById).toHaveBeenCalledWith(tournamentId);
  });

  it('Não deve retornar um torneio inexistente', async () => {
    // Arrange
    const tournamentId = 'non-existent-id';

    mockQueryService.tournamentQuery.findById.mockResolvedValueOnce(null);

    // Act & Assert
    await expect(useCase.execute(tournamentId)).rejects.toThrow(EntityNotFoundException);
    await expect(useCase.execute(tournamentId)).rejects.toThrow(`Tournament with id ${tournamentId} not found.`);
    expect(mockQueryService.tournamentQuery.findById).toHaveBeenCalledWith(tournamentId);
  });

  it('Deve propagar erros da query', async () => {
    // Arrange
    const tournamentId = 'tournament-123';
    const queryError = new Error('Database connection failed');

    mockQueryService.tournamentQuery.findById.mockRejectedValueOnce(queryError);

    // Act & Assert
    await expect(useCase.execute(tournamentId)).rejects.toThrow('Database connection failed');
  });
});
