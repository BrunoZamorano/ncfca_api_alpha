import { Inject, Injectable, ForbiddenException } from '@nestjs/common';

import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { ID_GENERATOR } from '@/shared/constants/service-constants';
import IdGenerator from '@/application/services/id-generator';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';

@Injectable()
export default class ApproveEnrollment {
  public constructor(
    @Inject(UNIT_OF_WORK) private readonly _uow: UnitOfWork,
    @Inject(ID_GENERATOR) private readonly _idGenerator: IdGenerator,
  ) {}

  async execute(input: { loggedInUserId: string; enrollmentRequestId: string }): Promise<void> {
    return await this._uow.executeInTransaction(async () => {
      const request = await this._uow.enrollmentRequestRepository.findById(input.enrollmentRequestId);
      if (!request) {
        throw new EntityNotFoundException('EnrollmentRequest', input.enrollmentRequestId);
      }
      if (request.status !== EnrollmentStatus.PENDING) {
        throw new InvalidOperationException('Cannot approve a request that is not pending.');
      }
      const club = await this._uow.clubRepository.find(request.clubId);
      if (!club) {
        throw new EntityNotFoundException('Club', request.clubId);
      }
      if (club.principalId !== input.loggedInUserId) {
        throw new ForbiddenException('User is not authorized to manage this enrollment request.');
      }
      const family = await this._uow.familyRepository.find(request.familyId);
      if (!family || !family.isAffiliated()) {
        throw new InvalidOperationException('Cannot approve enrollment for a family that is not affiliated.');
      }
      club.addMember(request.dependantId, request.familyId, this._idGenerator);
      request.approve();
      await this._uow.clubRepository.save(club);
      await this._uow.enrollmentRequestRepository.save(request);
    });
  }
}
