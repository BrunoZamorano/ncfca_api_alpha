import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';

@Injectable()
export default class ListMyEnrollmentRequests {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(loggedInUserId: string): Promise<EnrollmentRequest[]> {
    const family = await this.uow.familyRepository.findByHolderId(loggedInUserId);
    if (!family) {
      throw new EntityNotFoundException('Family', `for user ${loggedInUserId}`);
    }
    return this.uow.enrollmentRequestRepository.findByFamilyId(family.id);
  }
}