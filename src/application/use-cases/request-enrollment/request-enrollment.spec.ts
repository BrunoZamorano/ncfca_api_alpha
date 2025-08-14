import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import { FamilyStatus } from '@/domain/enums/family-status';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';
import { MembershipStatus } from '@/domain/enums/membership-status';
import { Sex } from '@/domain/enums/sex';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import Family from '@/domain/entities/family/family';
import Dependant from '@/domain/entities/dependant/dependant';
import Club from '@/domain/entities/club/club';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';
import ClubMembership from '@/domain/entities/club-membership/club-membership.entity';
import Address from '@/domain/value-objects/address/address';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';

import IdGenerator from '@/application/services/id-generator';

import { ID_GENERATOR } from '@/shared/constants/service-constants';

import RequestEnrollment, { RequestEnrollmentInput } from './request-enrollment';

describe('UNIT RequestEnrollment', () => {
  let useCase: RequestEnrollment;
  let mockUnitOfWork: any;
  let mockIdGenerator: IdGenerator;

  const mockFamily = new Family({
    id: 'family-123',
    holderId: 'user-123',
    status: FamilyStatus.AFFILIATED,
    dependants: [
      new Dependant({
        id: 'dependant-123',
        firstName: 'João',
        lastName: 'Silva',
        familyId: 'family-123',
        sex: Sex.MALE,
        relationship: DependantRelationship.SON,
        birthdate: new Birthdate('2010-01-01'),
      } as any),
    ],
  } as any);

  const mockClub = new Club({
    id: 'club-123',
    name: 'Clube de Teste',
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
    maxMembers: 2,
    principalId: 'principal-123',
  });

  beforeEach(async () => {
    mockUnitOfWork = {
      executeInTransaction: jest.fn().mockImplementation((callback) => callback()),
      familyRepository: {
        findByHolderId: jest.fn(),
      },
      clubRepository: {
        find: jest.fn(),
      },
      enrollmentRequestRepository: {
        findByDependantAndClub: jest.fn(),
        save: jest.fn(),
      },
      clubMembershipRepository: {
        findByMemberAndClub: jest.fn(),
      },
    };

    mockIdGenerator = {
      generate: jest.fn().mockReturnValue('generated-id-123'),
    } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        RequestEnrollment,
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork },
        { provide: ID_GENERATOR, useValue: mockIdGenerator },
      ],
    }).compile();

    useCase = moduleRef.get(RequestEnrollment);
    jest.clearAllMocks();
  });

  const input: RequestEnrollmentInput = {
    loggedInUserId: 'user-123',
    dependantId: 'dependant-123',
    clubId: 'club-123',
  };

  it('Deve criar solicitação de matrícula quando dados são válidos', async () => {
    // Arrange
    mockUnitOfWork.familyRepository.findByHolderId.mockResolvedValue(mockFamily);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.enrollmentRequestRepository.findByDependantAndClub.mockResolvedValue([]);
    mockUnitOfWork.clubMembershipRepository.findByMemberAndClub.mockResolvedValue(null);
    mockUnitOfWork.enrollmentRequestRepository.save.mockImplementation(async (req: any) => req);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result).toBeInstanceOf(EnrollmentRequest);
    expect(result.dependantId).toBe('dependant-123');
    expect(result.clubId).toBe('club-123');
    expect(mockUnitOfWork.enrollmentRequestRepository.save).toHaveBeenCalledTimes(1);
  });

  it('Deve permitir solicitação quando clube não tem limite de membros', async () => {
    // Arrange
    const clubWithoutLimit = new Club({
      id: 'club-123',
      name: 'Clube de Teste',
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
      maxMembers: undefined,
      principalId: 'principal-123',
    });
    mockUnitOfWork.familyRepository.findByHolderId.mockResolvedValue(mockFamily);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(clubWithoutLimit);
    mockUnitOfWork.enrollmentRequestRepository.findByDependantAndClub.mockResolvedValue([]);
    mockUnitOfWork.clubMembershipRepository.findByMemberAndClub.mockResolvedValue(null);
    mockUnitOfWork.enrollmentRequestRepository.save.mockImplementation(async (req: any) => req);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result).toBeInstanceOf(EnrollmentRequest);
    expect(mockUnitOfWork.enrollmentRequestRepository.save).toHaveBeenCalledTimes(1);
  });

  it('Não deve criar solicitação quando família não existe', async () => {
    // Arrange
    mockUnitOfWork.familyRepository.findByHolderId.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(EntityNotFoundException);
    await expect(useCase.execute(input)).rejects.toThrow('Family');
  });

  it('Não deve criar solicitação quando dependente não pertence à família', async () => {
    // Arrange
    const familyWithoutDependant = new Family({
      id: 'family-123',
      holderId: 'user-123',
      status: FamilyStatus.AFFILIATED,
      dependants: [],
    } as any);
    mockUnitOfWork.familyRepository.findByHolderId.mockResolvedValue(familyWithoutDependant);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(ForbiddenException);
    await expect(useCase.execute(input)).rejects.toThrow('O dependente não pertence à esta família.');
  });

  it('Não deve criar solicitação quando clube não existe', async () => {
    // Arrange
    mockUnitOfWork.familyRepository.findByHolderId.mockResolvedValue(mockFamily);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(EntityNotFoundException);
    await expect(useCase.execute(input)).rejects.toThrow('Club');
  });

  it('Não deve criar solicitação quando família não está afiliada', async () => {
    // Arrange
    const unaffiliatedFamily = new Family({
      id: 'family-123',
      holderId: 'user-123',
      status: FamilyStatus.NOT_AFFILIATED,
      dependants: [
        new Dependant({
          id: 'dependant-123',
          firstName: 'João',
          lastName: 'Silva',
          familyId: 'family-123',
          sex: Sex.MALE,
          relationship: DependantRelationship.SON,
          birthdate: new Birthdate('2010-01-01'),
        } as any),
      ],
    } as any);
    mockUnitOfWork.familyRepository.findByHolderId.mockResolvedValue(unaffiliatedFamily);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(ForbiddenException);
    await expect(useCase.execute(input)).rejects.toThrow('A família não está afiliada a um clube. Afilie-se primeiro.');
  });

  it('Não deve criar solicitação quando já existe solicitação pendente', async () => {
    // Arrange
    const pendingRequest = new EnrollmentRequest({
      id: 'request-123',
      dependantId: 'dependant-123',
      familyId: 'family-123',
      clubId: 'club-123',
      status: EnrollmentStatus.PENDING,
    });
    mockUnitOfWork.familyRepository.findByHolderId.mockResolvedValue(mockFamily);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.enrollmentRequestRepository.findByDependantAndClub.mockResolvedValue([pendingRequest]);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(InvalidOperationException);
    await expect(useCase.execute(input)).rejects.toThrow(
      'Uma solicitação de matrícula pendente já existe para este dependente neste clube.',
    );
  });

  it('Não deve criar solicitação quando dependente já é membro ativo', async () => {
    // Arrange
    const activeMembership = new ClubMembership({
      id: 'membership-123',
      clubId: 'club-123',
      memberId: 'dependant-123',
      familyId: 'family-123',
      status: MembershipStatus.ACTIVE,
    });
    mockUnitOfWork.familyRepository.findByHolderId.mockResolvedValue(mockFamily);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.enrollmentRequestRepository.findByDependantAndClub.mockResolvedValue([]);
    mockUnitOfWork.clubMembershipRepository.findByMemberAndClub.mockResolvedValue(activeMembership);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(InvalidOperationException);
    await expect(useCase.execute(input)).rejects.toThrow('O Dependente já é membro ativo deste clube.');
  });

  it('Não deve criar solicitação quando clube atingiu capacidade máxima', async () => {
    // Arrange
    const fullClub = new Club({
      id: 'club-123',
      name: 'Clube de Teste',
      address: new Address({
        street: 'Rua Teste',
        number: '123',
        district: 'Centro',
        city: 'Cidade',
        state: 'SP',
        zipCode: '12345-678',
      }),
      members: [
        new ClubMembership({
          id: 'membership-1',
          clubId: 'club-123',
          memberId: 'dependant-1',
          familyId: 'family-1',
          status: MembershipStatus.ACTIVE,
        }),
        new ClubMembership({
          id: 'membership-2',
          clubId: 'club-123',
          memberId: 'dependant-2',
          familyId: 'family-2',
          status: MembershipStatus.ACTIVE,
        }),
      ],
      createdAt: new Date(),
      maxMembers: 2,
      principalId: 'principal-123',
    });
    mockUnitOfWork.familyRepository.findByHolderId.mockResolvedValue(mockFamily);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(fullClub);
    mockUnitOfWork.enrollmentRequestRepository.findByDependantAndClub.mockResolvedValue([]);
    mockUnitOfWork.clubMembershipRepository.findByMemberAndClub.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(InvalidOperationException);
    await expect(useCase.execute(input)).rejects.toThrow('O clube já atingiu o número máximo de membros.');
  });
});