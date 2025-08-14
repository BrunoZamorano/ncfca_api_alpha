import { Test } from '@nestjs/testing';

import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import { MembershipStatus } from '@/domain/enums/membership-status';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { DependantType } from '@/domain/enums/dependant-type.enum';
import { Sex } from '@/domain/enums/sex';
import Club from '@/domain/entities/club/club';
import Dependant from '@/domain/entities/dependant/dependant';
import ClubMembership from '@/domain/entities/club-membership/club-membership.entity';
import Address from '@/domain/value-objects/address/address';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';

import AdminListClubMembersUseCase from './list-club-members.use-case';
import { ListClubMembersQuery } from './list-club-members.query';

describe('UNIT AdminListClubMembersUseCase', () => {
  let useCase: AdminListClubMembersUseCase;
  let mockUnitOfWork: any;

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

  const mockDependant = new Dependant({
    id: 'dependant-123',
    firstName: 'João',
    lastName: 'Silva',
    familyId: 'family-123',
    sex: Sex.MALE,
    relationship: DependantRelationship.SON,
    type: DependantType.STUDENT,
    birthdate: new Birthdate('2010-01-01'),
    phone: '11999999999',
  } as any);

  const mockMembership = new ClubMembership({
    id: 'membership-123',
    clubId: 'club-123',
    memberId: 'dependant-123',
    familyId: 'family-123',
    status: MembershipStatus.ACTIVE,
  });

  beforeEach(async () => {
    mockUnitOfWork = {
      clubRepository: {
        find: jest.fn(),
      },
      clubMembershipRepository: {
        findByClub: jest.fn(),
      },
      familyRepository: {
        findDependant: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AdminListClubMembersUseCase, { provide: UNIT_OF_WORK, useValue: mockUnitOfWork }],
    }).compile();

    useCase = moduleRef.get(AdminListClubMembersUseCase);
    jest.clearAllMocks();
  });

  it('Deve listar membros do clube com sucesso', async () => {
    // Arrange
    const query = new ListClubMembersQuery('club-123', 1, 10);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.clubMembershipRepository.findByClub.mockResolvedValue([mockMembership]);
    mockUnitOfWork.familyRepository.findDependant.mockResolvedValue(mockDependant);

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
    const secondMembership = new ClubMembership({
      id: 'membership-456',
      clubId: 'club-123',
      memberId: 'dependant-456',
      familyId: 'family-456',
      status: MembershipStatus.ACTIVE,
    });
    const secondDependant = new Dependant({
      id: 'dependant-456',
      firstName: 'Maria',
      lastName: 'Santos',
      familyId: 'family-456',
      sex: Sex.FEMALE,
      relationship: DependantRelationship.DAUGHTER,
      type: DependantType.STUDENT,
      birthdate: new Birthdate('2011-01-01'),
    } as any);

    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.clubMembershipRepository.findByClub.mockResolvedValue([mockMembership, secondMembership]);
    mockUnitOfWork.familyRepository.findDependant.mockResolvedValueOnce(mockDependant).mockResolvedValueOnce(secondDependant);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result.members).toHaveLength(1);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(1);
  });

  it('Não deve listar quando clube não existe', async () => {
    // Arrange
    const query = new ListClubMembersQuery('non-existent-club', 1, 10);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(query)).rejects.toThrow(EntityNotFoundException);
    await expect(useCase.execute(query)).rejects.toThrow('Club');
  });

  it('Deve filtrar apenas membros ativos', async () => {
    // Arrange
    const query = new ListClubMembersQuery('club-123', 1, 10);
    const revokedMembership = new ClubMembership({
      id: 'membership-revoked',
      clubId: 'club-123',
      memberId: 'dependant-revoked',
      familyId: 'family-revoked',
      status: MembershipStatus.REVOKED,
    });

    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.clubMembershipRepository.findByClub.mockResolvedValue([mockMembership, revokedMembership]);
    mockUnitOfWork.familyRepository.findDependant.mockResolvedValue(mockDependant);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result.members).toHaveLength(1);
    expect(result.members[0].status).toBe(MembershipStatus.ACTIVE);
    expect(mockUnitOfWork.familyRepository.findDependant).toHaveBeenCalledTimes(1);
  });

  it('Deve retornar lista vazia quando clube não tem membros', async () => {
    // Arrange
    const query = new ListClubMembersQuery('club-123', 1, 10);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.clubMembershipRepository.findByClub.mockResolvedValue([]);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result.members).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });
});
