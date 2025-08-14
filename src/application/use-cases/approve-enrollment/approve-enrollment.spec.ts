import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';
import { FamilyStatus } from '@/domain/enums/family-status';
import { MembershipStatus } from '@/domain/enums/membership-status';
import Family from '@/domain/entities/family/family';
import Club from '@/domain/entities/club/club';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';
import ClubMembership from '@/domain/entities/club-membership/club-membership.entity';
import Address from '@/domain/value-objects/address/address';

import IdGenerator from '@/application/services/id-generator';

import { ID_GENERATOR } from '@/shared/constants/service-constants';

import ApproveEnrollment from './approve-enrollment';

describe('UNIT ApproveEnrollment', () => {
  let useCase: ApproveEnrollment;
  let mockUnitOfWork: any;
  let mockIdGenerator: IdGenerator;

  const mockEnrollmentRequest = new EnrollmentRequest({
    id: 'request-123',
    dependantId: 'dependant-123',
    familyId: 'family-123',
    clubId: 'club-123',
    status: EnrollmentStatus.PENDING,
  });

  const mockFamily = new Family({
    id: 'family-123',
    holderId: 'user-123',
    status: FamilyStatus.AFFILIATED,
    affiliationExpiresAt: new Date(Date.now() + 86400000),
    dependants: [],
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
      enrollmentRequestRepository: {
        findById: jest.fn(),
        save: jest.fn(),
      },
      clubRepository: {
        find: jest.fn(),
        save: jest.fn(),
      },
      familyRepository: {
        find: jest.fn(),
      },
    };

    mockIdGenerator = {
      generate: jest.fn().mockReturnValue('generated-id-123'),
    } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [ApproveEnrollment, { provide: UNIT_OF_WORK, useValue: mockUnitOfWork }, { provide: ID_GENERATOR, useValue: mockIdGenerator }],
    }).compile();

    useCase = moduleRef.get(ApproveEnrollment);
    jest.clearAllMocks();
  });

  const input = {
    loggedInUserId: 'principal-123',
    enrollmentRequestId: 'request-123',
  };

  it('Deve aprovar solicitação quando dados são válidos', async () => {
    // Arrange
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(mockEnrollmentRequest);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.familyRepository.find.mockResolvedValue(mockFamily);
    mockUnitOfWork.clubRepository.save.mockResolvedValue(undefined);
    mockUnitOfWork.enrollmentRequestRepository.save.mockResolvedValue(undefined);

    // Act
    await useCase.execute(input);

    // Assert
    expect(mockUnitOfWork.clubRepository.save).toHaveBeenCalledTimes(1);
    expect(mockUnitOfWork.enrollmentRequestRepository.save).toHaveBeenCalledTimes(1);
  });

  it('Deve aprovar solicitação quando clube não tem limite de membros', async () => {
    // Arrange
    const pendingRequest = new EnrollmentRequest({
      id: 'request-123',
      dependantId: 'dependant-123',
      familyId: 'family-123',
      clubId: 'club-123',
      status: EnrollmentStatus.PENDING,
    });
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
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(pendingRequest);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(clubWithoutLimit);
    mockUnitOfWork.familyRepository.find.mockResolvedValue(mockFamily);
    mockUnitOfWork.clubRepository.save.mockResolvedValue(undefined);
    mockUnitOfWork.enrollmentRequestRepository.save.mockResolvedValue(undefined);

    // Act
    await useCase.execute(input);

    // Assert
    expect(mockUnitOfWork.clubRepository.save).toHaveBeenCalledTimes(1);
    expect(mockUnitOfWork.enrollmentRequestRepository.save).toHaveBeenCalledTimes(1);
  });

  it('Não deve aprovar quando solicitação não existe', async () => {
    // Arrange
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(EntityNotFoundException);
    await expect(useCase.execute(input)).rejects.toThrow('EnrollmentRequest');
  });

  it('Não deve aprovar quando solicitação não está pendente', async () => {
    // Arrange
    const approvedRequest = new EnrollmentRequest({
      id: 'request-123',
      dependantId: 'dependant-123',
      familyId: 'family-123',
      clubId: 'club-123',
      status: EnrollmentStatus.APPROVED,
    });
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(approvedRequest);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(InvalidOperationException);
    await expect(useCase.execute(input)).rejects.toThrow('Cannot approve a request that is not pending.');
  });

  it('Não deve aprovar quando clube não existe', async () => {
    // Arrange
    const pendingRequest = new EnrollmentRequest({
      id: 'request-123',
      dependantId: 'dependant-123',
      familyId: 'family-123',
      clubId: 'club-123',
      status: EnrollmentStatus.PENDING,
    });
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(pendingRequest);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(EntityNotFoundException);
    await expect(useCase.execute(input)).rejects.toThrow('Club');
  });

  it('Não deve aprovar quando usuário não é autorizado', async () => {
    // Arrange
    const unauthorizedInput = {
      loggedInUserId: 'other-user-123',
      enrollmentRequestId: 'request-123',
    };
    const pendingRequest = new EnrollmentRequest({
      id: 'request-123',
      dependantId: 'dependant-123',
      familyId: 'family-123',
      clubId: 'club-123',
      status: EnrollmentStatus.PENDING,
    });
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(pendingRequest);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);

    // Act & Assert
    await expect(useCase.execute(unauthorizedInput)).rejects.toThrow(ForbiddenException);
    await expect(useCase.execute(unauthorizedInput)).rejects.toThrow('User is not authorized to manage this enrollment request.');
  });

  it('Não deve aprovar quando família não está afiliada', async () => {
    // Arrange
    const pendingRequest = new EnrollmentRequest({
      id: 'request-123',
      dependantId: 'dependant-123',
      familyId: 'family-123',
      clubId: 'club-123',
      status: EnrollmentStatus.PENDING,
    });
    const unaffiliatedFamily = new Family({
      id: 'family-123',
      holderId: 'user-123',
      status: FamilyStatus.NOT_AFFILIATED,
      dependants: [],
    } as any);
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(pendingRequest);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.familyRepository.find.mockResolvedValue(unaffiliatedFamily);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(InvalidOperationException);
    await expect(useCase.execute(input)).rejects.toThrow('Cannot approve enrollment for a family that is not affiliated.');
  });

  it('Não deve aprovar quando clube atingiu capacidade máxima', async () => {
    // Arrange
    const pendingRequest = new EnrollmentRequest({
      id: 'request-123',
      dependantId: 'dependant-123',
      familyId: 'family-123',
      clubId: 'club-123',
      status: EnrollmentStatus.PENDING,
    });
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
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(pendingRequest);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(fullClub);
    mockUnitOfWork.familyRepository.find.mockResolvedValue(mockFamily);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(InvalidOperationException);
    await expect(useCase.execute(input)).rejects.toThrow('O clube já atingiu o número máximo de membros.');
  });
});
