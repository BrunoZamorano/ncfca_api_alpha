import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';

@Injectable()
export default class ListAllEnrollments {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: { loggedInUserId: string }): Promise<EnrollmentRequest[]> {
    const club = await this.uow.clubRepository.findByPrincipalId(input.loggedInUserId);
    if (!club) throw new EntityNotFoundException('Club', `For principal id: ${input.loggedInUserId}`);
    if (club.principalId !== input.loggedInUserId) {
      throw new ForbiddenException('User is not the owner of this club.');
    }
    return await this.uow.enrollmentRequestRepository.findByClubId(club.id);
  }
}
