import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';

@Injectable()
export default class RejectEnrollment {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: { loggedInUserId: string; enrollmentRequestId: string; reason: string }): Promise<void> {
    return await this.uow.executeInTransaction(async () => {
      const request = await this.uow.enrollmentRequestRepository.findById(input.enrollmentRequestId);
      if (!request) throw new EntityNotFoundException('EnrollmentRequest', input.enrollmentRequestId);
      const club = await this.uow.clubRepository.find(request.clubId);
      if (!club || club.principalId !== input.loggedInUserId) {
        throw new ForbiddenException('User is not authorized to manage this enrollment request.');
      }
      request.reject(input.reason);
      await this.uow.enrollmentRequestRepository.save(request);
      return void 0;
    });
  }
}
