import { Test, TestingModule } from '@nestjs/testing';

import { QUERY_SERVICE, QueryService } from '@/application/services/query.service';
import { GetMyPendingRegistrationsListItemView } from '@/application/queries/tournament-query/get-my-pending-registrations-list-item.view';
import { GetMyPendingRegistrations } from './get-my-pending-registrations.use-case';

describe('GetMyPendingRegistrations', () => {
  let useCase: GetMyPendingRegistrations;
  let queryService: jest.Mocked<QueryService>;

  beforeEach(async () => {
    const mockQueryService = {
      tournamentQuery: {
        getMyPendingRegistrations: jest.fn(),
        findById: jest.fn(),
        search: jest.fn(),
      },
      enrollmentQuery: {},
      dependantQuery: {},
      trainingQuery: {},
      clubQuery: {},
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyPendingRegistrations,
        {
          provide: QUERY_SERVICE,
          useValue: mockQueryService,
        },
      ],
    }).compile();

    useCase = module.get<GetMyPendingRegistrations>(GetMyPendingRegistrations);
    queryService = module.get<QueryService>(QUERY_SERVICE) as jest.Mocked<QueryService>;
  });

  it('deve ser definido', () => {
    expect(useCase).toBeDefined();
  });

  it('deve retornar lista de inscrições pendentes para o holder', async () => {
    // Arrange
    const holderId = 'holder-123';
    const expectedRegistrations: GetMyPendingRegistrationsListItemView[] = [
      {
        registrationId: 'registration-123',
        tournamentName: 'Torneio Nacional 2024',
        competitorName: 'João Silva',
        competitorId: 'competitor-123',
        requestedAt: new Date('2024-01-15T10:30:00Z'),
        tournamentType: 'DUO',
      },
    ];

    (queryService.tournamentQuery.getMyPendingRegistrations as jest.Mock).mockResolvedValue(expectedRegistrations);

    // Act
    const result = await useCase.execute(holderId);

    // Assert
    expect(result).toEqual(expectedRegistrations);
    expect(queryService.tournamentQuery.getMyPendingRegistrations).toHaveBeenCalledWith(holderId);
    expect(queryService.tournamentQuery.getMyPendingRegistrations).toHaveBeenCalledTimes(1);
  });

  it('deve retornar lista vazia quando não há inscrições pendentes', async () => {
    // Arrange
    const holderId = 'holder-123';
    (queryService.tournamentQuery.getMyPendingRegistrations as jest.Mock).mockResolvedValue([]);

    // Act
    const result = await useCase.execute(holderId);

    // Assert
    expect(result).toEqual([]);
    expect(queryService.tournamentQuery.getMyPendingRegistrations).toHaveBeenCalledWith(holderId);
    expect(queryService.tournamentQuery.getMyPendingRegistrations).toHaveBeenCalledTimes(1);
  });
});
