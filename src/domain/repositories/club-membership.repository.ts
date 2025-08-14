import ClubMembership from '@/domain/entities/club-membership/club-membership.entity';

export default interface ClubMembershipRepository {
  findById(id: string): Promise<ClubMembership | null>;
  findByMemberAndClub(memberId: string, clubId: string): Promise<ClubMembership | null>;
  findByClub(clubId: string): Promise<ClubMembership[]>;
  save(membership: ClubMembership): Promise<ClubMembership>;
};;;;;;;;;;

export const CLUB_MEMBERSHIP_REPOSITORY = Symbol('CLUB_MEMBERSHIP_REPOSITORY');
