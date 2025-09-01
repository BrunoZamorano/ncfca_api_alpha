import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infraestructure/database/prisma.service';

import ClubRepository from '@/domain/repositories/club-repository';
import Club from '@/domain/entities/club/club';
import { MembershipStatus } from '@/domain/enums/membership-status';

import ClubMembershipMapper from '@/shared/mappers/club-membership.mapper';
import ClubMapper from '@/shared/mappers/club.mapper';

@Injectable()
export class ClubRepositoryPrisma implements ClubRepository {
  private readonly select = {
    id: true,
    name: true,
    _count: { select: { memberships: { where: { status: MembershipStatus.ACTIVE } } } },
    created_at: true,
    updated_at: true,
    max_members: true,
    memberships: { where: { status: MembershipStatus.ACTIVE } },
    principal_id: true,
    city: true,
    state: true,
    number: true,
    street: true,
    zip_code: true,
    complement: true,
    neighborhood: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  async find(id: string): Promise<Club | null> {
    if (!id) return null;
    const club = await this.prisma.club.findUnique({
      where: { id },
      select: this.select,
    });
    return club ? ClubMapper.modelToEntity(club) : null;
  }

  async findByPrincipalId(ownerId: string): Promise<Club | null> {
    if (!ownerId) return null;
    const club = await this.prisma.club.findUnique({
      where: { principal_id: ownerId },
      select: this.select,
    });
    return club ? ClubMapper.modelToEntity(club) : null;
  }

  async findAll(): Promise<Club[]> {
    const clubs = await this.prisma.club.findMany({ select: this.select });
    return clubs.map((model) => ClubMapper.modelToEntity(model));
  }

  async save(club: Club): Promise<Club> {
    const clubData = ClubMapper.entityToModel(club);
    const memberOperations = club.members.map((p) => {
      const membershipData = ClubMembershipMapper.toPersistence(p);
      return this.prisma.clubMembership.upsert({
        where: { id: p.id },
        update: membershipData,
        create: membershipData,
      });
    });

    const [upsertedClub] = await this.prisma.$transaction([
      this.prisma.club.upsert({
        where: { id: club.id },
        update: clubData,
        create: clubData,
      }),
      ...memberOperations,
    ]);
    return ClubMapper.modelToEntity(upsertedClub);
  }
}
