import { Test } from '@nestjs/testing';

import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import { ClubRequestStatus } from '@/domain/enums/club-request-status.enum';
import ClubRepository from '@/domain/repositories/club-repository';
import ClubRequest from '@/domain/entities/club-request/club-request.entity';
import Club from '@/domain/entities/club/club';

import IdGenerator from '@/application/services/id-generator';

import { CLUB_REPOSITORY, CLUB_REQUEST_REPOSITORY } from '@/shared/constants/repository-constants';
import { ID_GENERATOR } from '@/shared/constants/service-constants';

import CreateClubRequestUseCase, { CreateClubRequestInput } from './create-club-request.use-case';

describe('CreateClubRequestUseCase', () => {
  let useCase: CreateClubRequestUseCase;
  let clubRequestRepository: ClubRequestRepository;
  let clubRepository: ClubRepository;
  let idGenerator: IdGenerator;

  const mockClubRequestRepository = {
    save: jest.fn(),
    listPendingByRequesterId: jest.fn(),
  };

  const mockClubRepository = { findByPrincipalId: jest.fn() };
  const mockIdGenerator = { generate: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateClubRequestUseCase,
        { provide: CLUB_REQUEST_REPOSITORY, useValue: mockClubRequestRepository },
        { provide: CLUB_REPOSITORY, useValue: mockClubRepository },
        { provide: ID_GENERATOR, useValue: mockIdGenerator },
      ],
    }).compile();

    useCase = moduleRef.get(CreateClubRequestUseCase);
    clubRequestRepository = moduleRef.get(CLUB_REQUEST_REPOSITORY);
    clubRepository = moduleRef.get(CLUB_REPOSITORY);
    idGenerator = moduleRef.get(ID_GENERATOR);

    jest.clearAllMocks();
  });

  const input: CreateClubRequestInput = {
    requesterId: 'user-123',
    clubName: 'Clube de Teste',
    address: { street: 'Rua dos Testes', number: '123', district: 'Centro', city: 'Cidade Teste', state: 'TS', zipCode: '12345-678' },
  };

  it('Deve criar e salvar uma nova solicitação de clube com sucesso', async () => {
    const generatedId = 'generated-uuid-12345';
    jest.spyOn(idGenerator, 'generate').mockReturnValue(generatedId);
    jest.spyOn(clubRepository, 'findByPrincipalId').mockResolvedValue(null);
    jest.spyOn(clubRequestRepository, 'listPendingByRequesterId').mockResolvedValue([]);
    jest.spyOn(clubRequestRepository, 'save').mockImplementation(async (req) => req);

    const result = await useCase.execute(input);

    expect(result.id).toBe(generatedId);
    expect(result.status).toBe(ClubRequestStatus.PENDING);
    expect(clubRequestRepository.save).toHaveBeenCalledTimes(1);
  });

  it('Deve lançar uma exceção se o solicitante já for dono de um clube', async () => {
    jest.spyOn(clubRepository, 'findByPrincipalId').mockResolvedValue(new Club({} as any));

    await expect(useCase.execute(input)).rejects.toThrow('Um usuário que já é dono de um clube não pode criar uma nova solicitação.');
    expect(clubRequestRepository.save).not.toHaveBeenCalled();
  });

  it('Deve lançar uma exceção se o solicitante já possui uma solicitação pendente', async () => {
    const pendingRequest = new ClubRequest({ status: ClubRequestStatus.PENDING } as any);
    jest.spyOn(clubRepository, 'findByPrincipalId').mockResolvedValue(null);
    jest.spyOn(clubRequestRepository, 'listPendingByRequesterId').mockResolvedValue([pendingRequest]);

    await expect(useCase.execute(input)).rejects.toThrow('O usuário já possui uma solicitação de clube pendente.');

    expect(clubRequestRepository.listPendingByRequesterId).toHaveBeenCalledWith(input.requesterId);
    expect(clubRequestRepository.save).not.toHaveBeenCalled();
  });
});
