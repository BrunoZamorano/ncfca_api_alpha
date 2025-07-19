import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { MembershipStatus } from '@/domain/enums/membership-status';
import ClubMembership from '@/domain/entities/club-membership/club-membership.entity';
import { ClubMemberDto } from '@/domain/dtos/club-member.dto';

@Injectable()
export default class ListMembersOfMyClub {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: { loggedInUserId: string }): Promise<ClubMemberDto[]> {
    const club = await this.uow.clubRepository.findByOwnerId(input.loggedInUserId);
    if (!club) throw new EntityNotFoundException('Club', 'for user: ' + input.loggedInUserId);
    if (club.principalId !== input.loggedInUserId) throw new ForbiddenException('User is not the owner of this club.');
    const memberships = await this.uow.clubMembershipRepository.findByClub(club.id);
    const activeMembers = memberships.filter((p) => p.status === MembershipStatus.ACTIVE);
    if (activeMembers.length === 0) return [];
    const members: ClubMemberDto[] = [];
    for (const membership of activeMembers) {
      const family = await this.uow.familyRepository.find(membership.familyId);
      if (!family) throw new EntityNotFoundException('Family', 'for membership: ' + membership.id);
      const holder = await this.uow.userRepository.find(family.holderId);
      if (!holder) throw new EntityNotFoundException('Holder', 'for family: ' + family.id);
      const dependant = family.dependants.find((d) => d.id === membership.memberId);
      if (!dependant) throw new EntityNotFoundException('Dependant', 'for membership: ' + membership.id);
      members.push({
        id: membership.memberId,
        firstName: dependant.firstName,
        lastName: dependant.lastName,
        email: holder.email,
        phone: holder.phone,
        holder: {
          id: holder.id,
          firstName: holder.firstName,
          lastName: holder.lastName,
          email: holder.email,
          phone: holder.phone,
        },
        memberSince: membership.createdAt,
      });
    }
    return members;
  }
}
