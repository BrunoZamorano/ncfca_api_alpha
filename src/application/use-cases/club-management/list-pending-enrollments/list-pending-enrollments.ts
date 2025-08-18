import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';

@Injectable()
export default class ListPendingEnrollments {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: Input): Promise<(EnrollmentRequest & { dependantName: string })[]> {
    const club = await this.uow.clubRepository.find(input.clubId);
    if (!club) throw new EntityNotFoundException('Club', input.clubId);
    if (club.principalId !== input.loggedInUserId) {
      throw new ForbiddenException('User is not the owner of this club.');
    }
    const allRequests = await this.uow.enrollmentRequestRepository.findByClubId(input.clubId);
    if (!allRequests || allRequests.length === 0) {
      return [];
    }
    const pendingRequests = allRequests.filter((request) => request.status === EnrollmentStatus.PENDING);
    for (const request of pendingRequests) {
      const family = await this.uow.familyRepository.find(request.familyId);
      if (!family) throw new EntityNotFoundException('Dependant', request.dependantId);
      const dependant = family.dependants.find((p) => p.id === request.dependantId);
      if (!dependant) throw new EntityNotFoundException('Dependant', request.dependantId);
      Object.assign(request, { dependantName: `${dependant.firstName} ${dependant.lastName}` });
    }
    return pendingRequests as (EnrollmentRequest & { dependantName: string })[];
  }
}

interface Input {
  loggedInUserId: string;
  clubId: string;
}
