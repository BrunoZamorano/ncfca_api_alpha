import { ClientProxy } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';

import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import { ClubRequestStatus } from '@/domain/enums/club-request-status.enum';
import ClubRequest from '@/domain/entities/club-request/club-request.entity';

import { createClubRequestStub } from '@/application/use-cases/club-request/approve-club-request/club-request.stub';
import ApproveClubRequest from '@/application/use-cases/club-request/approve-club-request/approve-club-request.use-case';

import { CLUB_REQUEST_REPOSITORY } from '@/shared/constants/repository-constants';
import { CLUB_EVENTS_SERVICE } from '@/shared/constants/service-constants';

describe('Approve Club Request Use Case', () => {
  let useCase: ApproveClubRequest;
  let repositoryMock: ClubRequestRepository;
  let clientProxyMock: ClientProxy;
  const clubRequestStub = createClubRequestStub();

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ApproveClubRequest,
        {
          provide: CLUB_REQUEST_REPOSITORY,
          useValue: {
            findById: jest.fn().mockResolvedValue(clubRequestStub),
            save: jest.fn().mockResolvedValue(clubRequestStub),
          },
        },
        {
          provide: CLUB_EVENTS_SERVICE,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get<ApproveClubRequest>(ApproveClubRequest);
    repositoryMock = moduleRef.get<ClubRequestRepository>(CLUB_REQUEST_REPOSITORY);
    clientProxyMock = moduleRef.get<ClientProxy>(CLUB_EVENTS_SERVICE);
  });

  it('Deve aprovar uma requisição de abertura de clube, salvar o novo estado e emitir um evento', async () => {
    const clubRequestId = clubRequestStub.id;
    await useCase.execute({ clubRequestId });
    const savedRequest = (repositoryMock.save as jest.Mock).mock.calls[0][0] as ClubRequest;
    expect(repositoryMock.findById).toHaveBeenCalledWith(clubRequestId);
    expect(savedRequest.status).toBe(ClubRequestStatus.APPROVED);
    expect(repositoryMock.save).toHaveBeenCalledWith(savedRequest);
    expect(clientProxyMock.emit).toHaveBeenCalledWith('club_request.approved', {
      requestId: clubRequestStub.id,
      requesterId: clubRequestStub.requesterId,
    });
  });
});
