// src/application/use-cases/club-request/get-user-club-requests/get-user-club-requests.use-case.spec.ts
import { Test } from '@nestjs/testing';
import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import { CLUB_REQUEST_REPOSITORY } from '@/shared/constants/repository-constants';
import { createClubRequestStub } from '../approve-club-request/club-request.stub';
import GetUserClubRequestsUseCase from './get-user-club-requests.use-case';

describe('GetUserClubRequestsUseCase', () => {
  let useCase: GetUserClubRequestsUseCase;
  let repository: ClubRequestRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GetUserClubRequestsUseCase,
        {
          provide: CLUB_REQUEST_REPOSITORY,
          useValue: {
            findByRequesterId: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get<GetUserClubRequestsUseCase>(GetUserClubRequestsUseCase);
    repository = moduleRef.get<ClubRequestRepository>(CLUB_REQUEST_REPOSITORY);
  });

  it('Deve buscar e mapear as solicitações de um usuário específico', async () => {
    const requesterId = 'user-123';
    const request = createClubRequestStub({ requesterId });
    jest.spyOn(repository, 'findByRequesterId').mockResolvedValue([request]);

    const result = await useCase.execute(requesterId);

    expect(repository.findByRequesterId).toHaveBeenCalledWith(requesterId);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(request.id);
  });
});
