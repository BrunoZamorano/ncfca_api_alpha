import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { MembershipStatus } from '@/domain/enums/membership-status';
import ClubMembership from '@/domain/entities/club-membership/club-membership.entity';

@Injectable()
export default class ListClubMembers {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: { loggedInUserId: string; clubId: string }): Promise<ClubMembership[]> {
    const club = await this.uow.clubRepository.find(input.clubId);
    if (!club) throw new EntityNotFoundException('Club', input.clubId);
    if (club.ownerId !== input.loggedInUserId) throw new ForbiddenException('User is not the owner of this club.');
    const memberships = await this.uow.clubMembershipRepository.findByClub(input.clubId);
    return memberships.filter((m) => m.status === MembershipStatus.ACTIVE);
  }
}
