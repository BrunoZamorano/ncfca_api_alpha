import { Test } from '@nestjs/testing';
import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import { CLUB_REQUEST_REPOSITORY } from '@/shared/constants/repository-constants';
import ListPendingClubRequestsUseCase from './list-pending-club-requests.use-case';
import { createClubRequestStub } from '../approve-club-request/club-request.stub';
import { ClubRequestStatus } from '@/domain/enums/club-request-status.enum';

describe('ListPendingClubRequestsUseCase', () => {
  let useCase: ListPendingClubRequestsUseCase;
  let repository: ClubRequestRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ListPendingClubRequestsUseCase,
        {
          provide: CLUB_REQUEST_REPOSITORY,
          useValue: {
            listPending: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get<ListPendingClubRequestsUseCase>(ListPendingClubRequestsUseCase);
    repository = moduleRef.get<ClubRequestRepository>(CLUB_REQUEST_REPOSITORY);
  });

  it('Deve buscar e mapear solicitações pendentes para DTOs', async () => {
    const request = createClubRequestStub({ status: ClubRequestStatus.PENDING });
    jest.spyOn(repository, 'listPending').mockResolvedValue([request]);

    const result = await useCase.execute();

    expect(repository.listPending).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(request.id);
    expect(result[0].status).toBe(ClubRequestStatus.PENDING);
  });
});
