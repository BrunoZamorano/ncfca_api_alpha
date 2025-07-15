import { ClubMembership as ClubMembershipData } from '@prisma/client';
import { MembershipStatus } from '@/domain/enums/membership-status';
import ClubMembership from '@/domain/entities/club-membership/club-membership.entity';

export default class ClubMembershipMapper {
  public static toDomain(data: ClubMembershipData): ClubMembership {
    return new ClubMembership({
      id: data.id,
      clubId: data.club_id,
      familyId: data.family_id,
      memberId: data.member_id,
      status: data.status as MembershipStatus,
    });
  }

  public static toPersistence(entity: ClubMembership): Omit<ClubMembershipData, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      club_id: entity.clubId,
      family_id: entity.familyId,
      member_id: entity.memberId,
      status: entity.status,
    };
  }
}
