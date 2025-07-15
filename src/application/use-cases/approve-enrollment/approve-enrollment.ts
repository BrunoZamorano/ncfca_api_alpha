import { Inject, Injectable, ForbiddenException } from '@nestjs/common';

import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import ClubMembership from '@/domain/entities/club-membership/club-membership.entity';
import { ID_GENERATOR } from '@/shared/constants/service-constants';
import IdGenerator from '@/application/services/id-generator';

@Injectable()
export default class ApproveEnrollment {
  public constructor(
    @Inject(UNIT_OF_WORK) private readonly _uow: UnitOfWork,
    @Inject(ID_GENERATOR) private readonly _idGenerator: IdGenerator,
  ) {}

  async execute(input: { loggedInUserId: string; enrollmentRequestId: string }): Promise<void> {
    return await this._uow.executeInTransaction(async () => {
      const request = await this._uow.enrollmentRequestRepository.findById(input.enrollmentRequestId);
      if (!request) throw new EntityNotFoundException('EnrollmentRequest', input.enrollmentRequestId);
      const club = await this._uow.clubRepository.find(request.clubId);
      if (!club || club.ownerId !== input.loggedInUserId) {
        throw new ForbiddenException('User is not authorized to manage this enrollment request.');
      }
      request.approve();
      const membership = ClubMembership.create(
        { clubId: club.id, familyId: request.familyId, memberId: request.dependantId },
        this._idGenerator,
      );
      await this._uow.clubMembershipRepository.save(membership);
      await this._uow.enrollmentRequestRepository.save(request);
      return void 0;
    });
  }
}
