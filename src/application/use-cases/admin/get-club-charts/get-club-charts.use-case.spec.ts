import { Test } from '@nestjs/testing';

import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import Club from '@/domain/entities/club/club';
import Address from '@/domain/value-objects/address/address';

import AdminGetClubChartsUseCase from './get-club-charts.use-case';
import { GetClubChartsQuery } from './get-club-charts.query';
import { GetClubChartsQueryPrisma, ClubChartsData } from '@/infraestructure/queries/get-club-charts.query.prisma';

describe('UNIT AdminGetClubChartsUseCase', () => {
  let useCase: AdminGetClubChartsUseCase;
  let mockUnitOfWork: any;
  let mockClubChartsQuery: jest.Mocked<GetClubChartsQueryPrisma>;

  const mockClub = new Club({
    id: 'club-123',
    name: 'Test Club',
    address: new Address({
      street: 'Rua Teste',
      number: '123',
      district: 'Centro',
      city: 'Cidade',
      state: 'SP',
      zipCode: '12345-678',
    }),
    members: [],
    createdAt: new Date(),
    principalId: 'principal-123',
  });

  const mockChartsData: ClubChartsData = {
    memberCountByType: [
      { type: 'STUDENT', count: 15 },
      { type: 'PARENT', count: 5 },
      { type: 'ALUMNI', count: 3 },
    ],
    enrollmentsOverTime: [
      { month: '2024-01', count: 5 },
      { month: '2024-02', count: 8 },
      { month: '2024-03', count: 3 },
    ],
    memberCountBySex: [
      { sex: 'MALE', count: 12 },
      { sex: 'FEMALE', count: 11 },
    ],
    totalActiveMembers: 23,
    totalPendingEnrollments: 4,
  };

  beforeEach(async () => {
    mockUnitOfWork = {
      clubRepository: {
        find: jest.fn(),
      },
    };

    mockClubChartsQuery = {
      execute: jest.fn(),
    } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminGetClubChartsUseCase,
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork },
        { provide: GetClubChartsQueryPrisma, useValue: mockClubChartsQuery },
      ],
    }).compile();

    useCase = moduleRef.get(AdminGetClubChartsUseCase);
    jest.clearAllMocks();
  });

  it('Deve retornar dados de gráficos com sucesso', async () => {
    // Arrange
    const query = new GetClubChartsQuery('club-123');
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockClubChartsQuery.execute.mockResolvedValue(mockChartsData);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result).toEqual(mockChartsData);
    expect(mockClubChartsQuery.execute).toHaveBeenCalledWith('club-123');
  });

  it('Não deve retornar dados quando clube não existe', async () => {
    // Arrange
    const query = new GetClubChartsQuery('non-existent-club');
    mockUnitOfWork.clubRepository.find.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(query)).rejects.toThrow(EntityNotFoundException);
    await expect(useCase.execute(query)).rejects.toThrow('Club');
    expect(mockClubChartsQuery.execute).not.toHaveBeenCalled();
  });

  it('Deve verificar se clube existe antes de executar query', async () => {
    // Arrange
    const query = new GetClubChartsQuery('club-123');
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockClubChartsQuery.execute.mockResolvedValue(mockChartsData);

    // Act
    await useCase.execute(query);

    // Assert
    expect(mockUnitOfWork.clubRepository.find).toHaveBeenCalledWith('club-123');
    expect(mockClubChartsQuery.execute).toHaveBeenCalledWith('club-123');
  });
});
