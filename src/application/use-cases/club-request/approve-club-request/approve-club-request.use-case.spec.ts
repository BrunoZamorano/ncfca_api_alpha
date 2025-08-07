import { Test } from '@nestjs/testing';

import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';
import ClubRequest from '@/domain/entities/club-request/club-request.entity';

import { createClubRequestStub } from '@/application/use-cases/club-request/approve-club-request/club-request.stub';
import ApproveClubRequest from '@/application/use-cases/club-request/approve-club-request/approve-club-request.use-case';
import { Queue } from '@/application/services/queue';

import { CLUB_REQUEST_REPOSITORY } from '@/shared/constants/repository-constants';
import { QUEUE_SERVICE } from '@/shared/constants/service-constants';
import ClubRequestModule from '@/shared/modules/club-request.module';

describe('Approve Club Request Use Case', () => {
  const queueServiceMock = { publish: jest.fn() } as unknown as Queue;
  const repositoryMock = {
    findById: () => Promise.resolve(requests[0]),
    save: jest.fn(),
  } as unknown as ClubRequestRepository;
  const requests: ClubRequest[] = [createClubRequestStub()];
  let requestsRepo: ClubRequestRepository;
  let useCase: ApproveClubRequest;

  beforeEach(async () => {
    const testModule = Test.createTestingModule({ imports: [ClubRequestModule] });
    testModule.overrideProvider(QUEUE_SERVICE).useValue(queueServiceMock);
    testModule.overrideProvider(CLUB_REQUEST_REPOSITORY).useValue(repositoryMock);
    const app = await testModule.compile();
    await app.init();
    useCase = app.get<ApproveClubRequest>(ApproveClubRequest);
    requestsRepo = app.get<ClubRequestRepository>(CLUB_REQUEST_REPOSITORY);
  });

  it('Deve aprovar uma requisição de abertura de clube', async () => {
    await useCase.execute({ clubRequestId: '' });
    const request = await requestsRepo.findById('');
    if (!request) throw new Error('Requisição não encontrada');
    expect(request.status).toBe(EnrollmentStatus.APPROVED);
    expect(queueServiceMock.publish).toHaveBeenCalledTimes(1);
  });
});
