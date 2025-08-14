import { Test } from '@nestjs/testing';

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

import AdminApproveEnrollmentUseCase from './approve-enrollment.use-case';
import { AdminApproveEnrollmentCommand } from './approve-enrollment.command';

describe('UNIT AdminApproveEnrollmentUseCase', () => {
  let useCase: AdminApproveEnrollmentUseCase;
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
    maxMembers: 5,
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
      providers: [
        AdminApproveEnrollmentUseCase,
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork },
        { provide: ID_GENERATOR, useValue: mockIdGenerator },
      ],
    }).compile();

    useCase = moduleRef.get(AdminApproveEnrollmentUseCase);
    jest.clearAllMocks();
  });

  it('Deve aprovar solicitação quando dados são válidos', async () => {
    // Arrange
    const command = new AdminApproveEnrollmentCommand('club-123', 'request-123');
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(mockEnrollmentRequest);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.familyRepository.find.mockResolvedValue(mockFamily);
    mockUnitOfWork.clubRepository.save.mockResolvedValue(undefined);
    mockUnitOfWork.enrollmentRequestRepository.save.mockResolvedValue(undefined);

    // Act
    await useCase.execute(command);

    // Assert
    expect(mockUnitOfWork.clubRepository.save).toHaveBeenCalledTimes(1);
    expect(mockUnitOfWork.enrollmentRequestRepository.save).toHaveBeenCalledTimes(1);
  });

  it('Não deve aprovar quando solicitação não existe', async () => {
    // Arrange
    const command = new AdminApproveEnrollmentCommand('club-123', 'non-existent-request');
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow(EntityNotFoundException);
    await expect(useCase.execute(command)).rejects.toThrow('EnrollmentRequest');
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
    const command = new AdminApproveEnrollmentCommand('club-123', 'request-123');
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(approvedRequest);

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow(InvalidOperationException);
    await expect(useCase.execute(command)).rejects.toThrow('Cannot approve a request that is not pending.');
  });

  it('Não deve aprovar quando solicitação não pertence ao clube especificado', async () => {
    // Arrange
    const wrongClubRequest = new EnrollmentRequest({
      id: 'request-123',
      dependantId: 'dependant-123',
      familyId: 'family-123',
      clubId: 'other-club-456',
      status: EnrollmentStatus.PENDING,
    });
    const command = new AdminApproveEnrollmentCommand('club-123', 'request-123');
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(wrongClubRequest);

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow(InvalidOperationException);
    await expect(useCase.execute(command)).rejects.toThrow('Enrollment request does not belong to the specified club.');
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
    const command = new AdminApproveEnrollmentCommand('club-123', 'request-123');
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(pendingRequest);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow(EntityNotFoundException);
    await expect(useCase.execute(command)).rejects.toThrow('Club');
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
    const command = new AdminApproveEnrollmentCommand('club-123', 'request-123');
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(pendingRequest);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.familyRepository.find.mockResolvedValue(unaffiliatedFamily);

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow(InvalidOperationException);
    await expect(useCase.execute(command)).rejects.toThrow(
      'Cannot approve enrollment for a family that is not affiliated.',
    );
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

    const command = new AdminApproveEnrollmentCommand('club-123', 'request-123');
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(pendingRequest);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(fullClub);
    mockUnitOfWork.familyRepository.find.mockResolvedValue(mockFamily);

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow(InvalidOperationException);
    await expect(useCase.execute(command)).rejects.toThrow('O clube já atingiu o número máximo de membros.');
  });
});