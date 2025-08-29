import { Test } from '@nestjs/testing';

import { QUERY_SERVICE } from '@/application/services/query.service';
import { MembershipStatus } from '@/domain/enums/membership-status';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { DependantType } from '@/domain/enums/dependant-type.enum';
import { Sex } from '@/domain/enums/sex';

import AdminListClubMembersUseCase from './list-club-members.use-case';
import { ListClubMembersQuery } from './list-club-members.query';

describe('(UNIT) AdminListClubMembersUseCase', () => {
  let useCase: AdminListClubMembersUseCase;
  let mockQueryService: any;

  const mockClubMembers = [
    {
      id: 'dependant-123',
      firstName: 'João',
      lastName: 'Silva',
      phone: '11999999999',
      relationship: DependantRelationship.SON,
      type: DependantType.STUDENT,
      sex: Sex.MALE,
      status: MembershipStatus.ACTIVE,
    },
    {
      id: 'dependant-456',
      firstName: 'Maria',
      lastName: 'Santos',
      phone: '11888888888',
      relationship: DependantRelationship.DAUGHTER,
      type: DependantType.STUDENT,
      sex: Sex.FEMALE,
      status: MembershipStatus.ACTIVE,
    },
  ];

  beforeEach(async () => {
    mockQueryService = {
      clubQuery: {
        getClubMembersListView: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AdminListClubMembersUseCase, { provide: QUERY_SERVICE, useValue: mockQueryService }],
    }).compile();

    useCase = moduleRef.get(AdminListClubMembersUseCase);
    jest.clearAllMocks();
  });

  it('Deve listar membros do clube com sucesso', async () => {
    // Arrange
    const query = new ListClubMembersQuery('club-123', 1, 10);
    mockQueryService.clubQuery.getClubMembersListView.mockResolvedValue([mockClubMembers[0]]);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result.members).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.members[0]).toMatchObject({
      id: 'dependant-123',
      firstName: 'João',
      lastName: 'Silva',
      phone: '11999999999',
      relationship: DependantRelationship.SON,
      type: DependantType.STUDENT,
      sex: Sex.MALE,
      status: MembershipStatus.ACTIVE,
    });
  });

  it('Deve aplicar paginação corretamente', async () => {
    // Arrange
    const query = new ListClubMembersQuery('club-123', 1, 1);
    mockQueryService.clubQuery.getClubMembersListView.mockResolvedValue(mockClubMembers);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result.members).toHaveLength(1);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(1);
    expect(result.members[0]).toMatchObject(mockClubMembers[0]);
  });

  it('Deve retornar lista vazia quando clube não tem membros', async () => {
    // Arrange
    const query = new ListClubMembersQuery('club-123', 1, 10);
    mockQueryService.clubQuery.getClubMembersListView.mockResolvedValue([]);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result.members).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });
});
