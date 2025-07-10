import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';

@Injectable()
export default class RemoveClubMember {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: { loggedInUserId: string; enrollmentRequestId: string }): Promise<void> {
    return await this.uow.executeInTransaction(async () => {
      const request = await this.uow.enrollmentRequestRepository.findById(input.enrollmentRequestId);
      if (!request) throw new EntityNotFoundException('EnrollmentRequest', input.enrollmentRequestId);
      const club = await this.uow.clubRepository.find(request.clubId);
      if (!club || club.ownerId !== input.loggedInUserId) {
        throw new ForbiddenException('User is not authorized to manage this enrollment request.');
      }
      if (request.status !== EnrollmentStatus.Approved) {
        throw new InvalidOperationException('Cannot remove a member whose enrollment is not approved.');
      }
      request.status = EnrollmentStatus.Revoked;
      request.resolvedAt = new Date();
      await this.uow.enrollmentRequestRepository.save(request);
    });
  }
}