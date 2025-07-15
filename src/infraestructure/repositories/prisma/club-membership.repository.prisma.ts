import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import ClubMembershipMapper from '@/shared/mappers/club-membership.mapper';
import { MembershipStatus } from '@/domain/enums/membership-status';
import ClubMembership from '@/domain/entities/club-membership/club-membership.entity';
import ClubMembershipRepository from '@/domain/repositories/club-membership.repository';

@Injectable()
export class ClubMembershipRepositoryPrisma implements ClubMembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<ClubMembership | null> {
    const membershipData = await this.prisma.clubMembership.findUnique({
      where: { id },
    });
    return membershipData ? ClubMembershipMapper.toEntity(membershipData) : null;
  }

  public async findByMemberAndClub(memberId: string, clubId: string): Promise<ClubMembership | null> {
    const membershipData = await this.prisma.clubMembership.findFirst({
      where: {
        member_id: memberId,
        club_id: clubId,
      },
    });
    return membershipData ? ClubMembershipMapper.toEntity(membershipData) : null;
  }

  public async findActiveByMemberAndClub(memberId: string, clubId: string): Promise<ClubMembership | null> {
    const membershipData = await this.prisma.clubMembership.findFirst({
      where: {
        member_id: memberId,
        club_id: clubId,
        status: MembershipStatus.ACTIVE,
      },
    });
    return membershipData ? ClubMembershipMapper.toEntity(membershipData) : null;
  }

  public async findByClub(clubId: string): Promise<ClubMembership[]> {
    const membershipsData = await this.prisma.clubMembership.findMany({
      where: { club_id: clubId },
    });
    return membershipsData.map(ClubMembershipMapper.toEntity);
  }

  public async findAllByFamily(familyId: string): Promise<ClubMembership[]> {
    const membershipsData = await this.prisma.clubMembership.findMany({
      where: { family_id: familyId },
    });
    return membershipsData.map(ClubMembershipMapper.toEntity);
  }

  public async save(membership: ClubMembership): Promise<ClubMembership> {
    const membershipData = ClubMembershipMapper.toPersistence(membership);

    const savedData = await this.prisma.clubMembership.upsert({
      where: { id: membership.id },
      update: membershipData,
      create: membershipData,
    });

    return ClubMembershipMapper.toEntity(savedData);
  }
}
