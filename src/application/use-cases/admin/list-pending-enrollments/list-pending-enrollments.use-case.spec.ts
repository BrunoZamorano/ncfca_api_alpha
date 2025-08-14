import { Test } from '@nestjs/testing';

import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { DependantType } from '@/domain/enums/dependant-type.enum';
import { Sex } from '@/domain/enums/sex';
import Club from '@/domain/entities/club/club';
import Dependant from '@/domain/entities/dependant/dependant';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';
import Address from '@/domain/value-objects/address/address';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';

import AdminListPendingEnrollmentsUseCase from './list-pending-enrollments.use-case';
import { ListPendingEnrollmentsQuery } from './list-pending-enrollments.query';

describe('UNIT AdminListPendingEnrollmentsUseCase', () => {
  let useCase: AdminListPendingEnrollmentsUseCase;
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

  const mockEnrollmentRequest = new EnrollmentRequest({
    id: 'request-123',
    dependantId: 'dependant-123',
    familyId: 'family-123',
    clubId: 'club-123',
    status: EnrollmentStatus.PENDING,
  });

  beforeEach(async () => {
    mockUnitOfWork = {
      clubRepository: {
        find: jest.fn(),
      },
      enrollmentRequestRepository: {
        findByClubId: jest.fn(),
      },
      familyRepository: {
        findDependant: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminListPendingEnrollmentsUseCase,
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork },
      ],
    }).compile();

    useCase = moduleRef.get(AdminListPendingEnrollmentsUseCase);
    jest.clearAllMocks();
  });

  it('Deve listar solicitações pendentes com sucesso', async () => {
    // Arrange
    const query = new ListPendingEnrollmentsQuery('club-123');
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.enrollmentRequestRepository.findByClubId.mockResolvedValue([mockEnrollmentRequest]);
    mockUnitOfWork.familyRepository.findDependant.mockResolvedValue(mockDependant);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'request-123',
      dependantId: 'dependant-123',
      dependantName: 'João Silva',
      dependantPhone: '11999999999',
      familyId: 'family-123',
      status: EnrollmentStatus.PENDING,
    });
    expect(result[0].requestedAt).toBeInstanceOf(Date);
  });

  it('Não deve listar quando clube não existe', async () => {
    // Arrange
    const query = new ListPendingEnrollmentsQuery('non-existent-club');
    mockUnitOfWork.clubRepository.find.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(query)).rejects.toThrow(EntityNotFoundException);
    await expect(useCase.execute(query)).rejects.toThrow('Club');
  });

  it('Deve filtrar apenas solicitações pendentes', async () => {
    // Arrange
    const query = new ListPendingEnrollmentsQuery('club-123');
    const approvedRequest = new EnrollmentRequest({
      id: 'request-approved',
      dependantId: 'dependant-approved',
      familyId: 'family-approved',
      clubId: 'club-123',
      status: EnrollmentStatus.APPROVED,
    });

    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.enrollmentRequestRepository.findByClubId.mockResolvedValue([mockEnrollmentRequest, approvedRequest]);
    mockUnitOfWork.familyRepository.findDependant.mockResolvedValue(mockDependant);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(EnrollmentStatus.PENDING);
    expect(mockUnitOfWork.familyRepository.findDependant).toHaveBeenCalledTimes(1);
  });

  it('Deve retornar lista vazia quando não há solicitações pendentes', async () => {
    // Arrange
    const query = new ListPendingEnrollmentsQuery('club-123');
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.enrollmentRequestRepository.findByClubId.mockResolvedValue([]);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result).toHaveLength(0);
  });

  it('Deve lidar com dependente não encontrado', async () => {
    // Arrange
    const query = new ListPendingEnrollmentsQuery('club-123');
    mockUnitOfWork.clubRepository.find.mockResolvedValue(mockClub);
    mockUnitOfWork.enrollmentRequestRepository.findByClubId.mockResolvedValue([mockEnrollmentRequest]);
    mockUnitOfWork.familyRepository.findDependant.mockResolvedValue(null);

    // Act
    const result = await useCase.execute(query);

    // Assert
    expect(result).toHaveLength(0);
  });
});