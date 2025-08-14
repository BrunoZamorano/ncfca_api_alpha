import { Test } from '@nestjs/testing';

import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';
import Club from '@/domain/entities/club/club';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';
import Address from '@/domain/value-objects/address/address';

import AdminRejectEnrollmentUseCase from './reject-enrollment.use-case';
import { AdminRejectEnrollmentCommand } from './reject-enrollment.command';

describe('UNIT AdminRejectEnrollmentUseCase', () => {
  let useCase: AdminRejectEnrollmentUseCase;
  let mockUnitOfWork: any;

  const mockEnrollmentRequest = new EnrollmentRequest({
    id: 'request-123',
    dependantId: 'dependant-123',
    familyId: 'family-123',
    clubId: 'club-123',
    status: EnrollmentStatus.PENDING,
  });

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
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminRejectEnrollmentUseCase,
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork },
      ],
    }).compile();

    useCase = moduleRef.get(AdminRejectEnrollmentUseCase);
    jest.clearAllMocks();
  });

  it('Deve rejeitar solicitação quando dados são válidos', async () => {
    // Arrange
    const command = new AdminRejectEnrollmentCommand('club-123', 'request-123', 'Motivo da rejeição');
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(mockEnrollmentRequest);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.enrollmentRequestRepository.save.mockResolvedValue(undefined);

    // Act
    await useCase.execute(command);

    // Assert
    expect(mockUnitOfWork.enrollmentRequestRepository.save).toHaveBeenCalledTimes(1);
  });

  it('Deve rejeitar solicitação sem motivo', async () => {
    // Arrange
    const pendingRequest = new EnrollmentRequest({
      id: 'request-123',
      dependantId: 'dependant-123',
      familyId: 'family-123',
      clubId: 'club-123',
      status: EnrollmentStatus.PENDING,
    });
    const command = new AdminRejectEnrollmentCommand('club-123', 'request-123');
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(pendingRequest);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.enrollmentRequestRepository.save.mockResolvedValue(undefined);

    // Act
    await useCase.execute(command);

    // Assert
    expect(mockUnitOfWork.enrollmentRequestRepository.save).toHaveBeenCalledTimes(1);
  });

  it('Não deve rejeitar quando solicitação não existe', async () => {
    // Arrange
    const command = new AdminRejectEnrollmentCommand('club-123', 'non-existent-request');
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow(EntityNotFoundException);
    await expect(useCase.execute(command)).rejects.toThrow('EnrollmentRequest');
  });

  it('Não deve rejeitar quando solicitação não está pendente', async () => {
    // Arrange
    const approvedRequest = new EnrollmentRequest({
      id: 'request-123',
      dependantId: 'dependant-123',
      familyId: 'family-123',
      clubId: 'club-123',
      status: EnrollmentStatus.APPROVED,
    });
    const command = new AdminRejectEnrollmentCommand('club-123', 'request-123');
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(approvedRequest);

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow(InvalidOperationException);
    await expect(useCase.execute(command)).rejects.toThrow('Cannot reject a request that is not pending.');
  });

  it('Não deve rejeitar quando solicitação não pertence ao clube especificado', async () => {
    // Arrange
    const wrongClubRequest = new EnrollmentRequest({
      id: 'request-123',
      dependantId: 'dependant-123',
      familyId: 'family-123',
      clubId: 'other-club-456',
      status: EnrollmentStatus.PENDING,
    });
    const command = new AdminRejectEnrollmentCommand('club-123', 'request-123');
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(wrongClubRequest);

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow(InvalidOperationException);
    await expect(useCase.execute(command)).rejects.toThrow('Enrollment request does not belong to the specified club.');
  });

  it('Não deve rejeitar quando clube não existe', async () => {
    // Arrange
    const pendingRequest = new EnrollmentRequest({
      id: 'request-123',
      dependantId: 'dependant-123',
      familyId: 'family-123',
      clubId: 'club-123',
      status: EnrollmentStatus.PENDING,
    });
    const command = new AdminRejectEnrollmentCommand('club-123', 'request-123');
    mockUnitOfWork.enrollmentRequestRepository.findById.mockResolvedValue(pendingRequest);
    mockUnitOfWork.clubRepository.find.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow(EntityNotFoundException);
    await expect(useCase.execute(command)).rejects.toThrow('Club');
  });
});