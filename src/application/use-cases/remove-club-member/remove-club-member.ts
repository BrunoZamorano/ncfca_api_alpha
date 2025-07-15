import { Inject, Injectable, ForbiddenException } from '@nestjs/common';

import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';

@Injectable()
export default class RemoveClubMember {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: Input): Promise<void> {
    return await this.uow.executeInTransaction(async () => {
      const membership = await this.uow.clubMembershipRepository.findById(input.membershipId);
      if (!membership) throw new EntityNotFoundException('Membership', 'for member id: ' + input.membershipId);
      const club = await this.uow.clubRepository.find(membership.clubId);
      if (!club || club.ownerId !== input.loggedInUserId) {
        throw new ForbiddenException('User is not authorized to manage this enrollment request.');
      }
      if (!membership.isActive()) {
        throw new InvalidOperationException('Cannot remove a member whose enrollment is not approved.');
      }
      membership.revoke();
      await this.uow.clubMembershipRepository.save(membership);
    });
  }
}

interface Input {
  loggedInUserId: string;
  membershipId: string;
}
