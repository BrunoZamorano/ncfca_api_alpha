import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { MembershipStatus } from '@/domain/enums/membership-status';
import ClubMembership from '@/domain/entities/club-membership/club-membership.entity';

@Injectable()
export default class ListMembersOfMyClub {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: { loggedInUserId: string }): Promise<ClubMembership[]> {
    const club = await this.uow.clubRepository.findByOwnerId(input.loggedInUserId);
    if (!club) throw new EntityNotFoundException('Club', 'for user: ' + input.loggedInUserId);
    if (club.principalId !== input.loggedInUserId) throw new ForbiddenException('User is not the owner of this club.');
    const memberships = await this.uow.clubMembershipRepository.findByClub(club.id);
    return memberships.filter((p) => p.status === MembershipStatus.ACTIVE);
  }
}
