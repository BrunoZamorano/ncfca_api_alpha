import { Test } from '@nestjs/testing';

import { TournamentListItemView } from '@/application/queries/tournament-query/tournament-list-item.view';
import { ListTournamentsQueryDto } from '@/infraestructure/dtos/tournament/list-tournaments-query.dto';
import { QueryService, QUERY_SERVICE } from '@/application/services/query.service';

import { ListTournaments } from './list-tournaments.use-case';

describe('(UNIT) ListTournaments', () => {
  let useCase: ListTournaments;
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
      providers: [
        ListTournaments,
        { provide: QUERY_SERVICE, useValue: mockQueryService },
      ],
    }).compile();

    useCase = moduleRef.get(ListTournaments);
    queryService = moduleRef.get(QUERY_SERVICE);

    jest.clearAllMocks();
  });

  const createMockTournamentList = (): TournamentListItemView[] => [
    {
      id: 'tournament-1',
      name: 'Torneio Nacional Individual',
      type: 'INDIVIDUAL',
      registrationStartDate: new Date('2024-01-01'),
      registrationEndDate: new Date('2024-01-15'),
      startDate: new Date('2024-02-01'),
      registrationCount: 5,
    },
    {
      id: 'tournament-2',
      name: 'Torneio Regional Duplas',
      type: 'DUO',
      registrationStartDate: new Date('2024-02-01'),
      registrationEndDate: new Date('2024-02-15'),
      startDate: new Date('2024-03-01'),
      registrationCount: 8,
    },
  ];

  it('Deve retornar uma lista de torneios', async () => {
    // Arrange
    const query: ListTournamentsQueryDto = {};
    const mockTournaments = createMockTournamentList();

    mockQueryService.tournamentQuery.search.mockResolvedValueOnce(mockTournaments);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result).toEqual(mockTournaments);
    expect(result).toHaveLength(2);
    expect(mockQueryService.tournamentQuery.search).toHaveBeenCalledWith(query);
  });

  it('Deve retornar lista filtrada por nome', async () => {
    // Arrange
    const query: ListTournamentsQueryDto = {
      filter: { name: 'Nacional' },
    };
    const filteredTournaments = [createMockTournamentList()[0]];

    mockQueryService.tournamentQuery.search.mockResolvedValueOnce(filteredTournaments);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result).toEqual(filteredTournaments);
    expect(result).toHaveLength(1);
    expect(mockQueryService.tournamentQuery.search).toHaveBeenCalledWith(query);
  });

  it('Deve retornar lista com paginação', async () => {
    // Arrange
    const query: ListTournamentsQueryDto = {
      pagination: { page: 1, limit: 1 },
    };
    const paginatedTournaments = [createMockTournamentList()[0]];

    mockQueryService.tournamentQuery.search.mockResolvedValueOnce(paginatedTournaments);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result).toEqual(paginatedTournaments);
    expect(result).toHaveLength(1);
    expect(mockQueryService.tournamentQuery.search).toHaveBeenCalledWith(query);
  });

  it('Deve retornar lista vazia quando não há torneios', async () => {
    // Arrange
    const query: ListTournamentsQueryDto = {};

    mockQueryService.tournamentQuery.search.mockResolvedValueOnce([]);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
    expect(mockQueryService.tournamentQuery.search).toHaveBeenCalledWith(query);
  });

  it('Deve propagar erros da query', async () => {
    // Arrange
    const query: ListTournamentsQueryDto = {};
    const queryError = new Error('Database connection failed');

    mockQueryService.tournamentQuery.search.mockRejectedValueOnce(queryError);

    // Act & Assert
    await expect(useCase.execute(query)).rejects.toThrow('Database connection failed');
  });
});