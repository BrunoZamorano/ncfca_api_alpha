import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';

@Injectable()
export default class ListPendingEnrollments {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: { loggedInUserId: string; clubId: string }): Promise<EnrollmentRequest[]> {
    const club = await this.uow.clubRepository.find(input.clubId);
    if (!club) throw new EntityNotFoundException('Club', input.clubId);
    if (club.ownerId !== input.loggedInUserId) {
      throw new ForbiddenException('User is not the owner of this club.');
    }
    const allRequests = await this.uow.enrollmentRequestRepository.findByClubId(input.clubId);
    return allRequests.filter((request) => request.status === EnrollmentStatus.PENDING);
  }
}
