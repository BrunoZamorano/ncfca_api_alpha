import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import ClubRepository from '@/domain/repositories/club-repository';
import Club from '@/domain/entities/club/club';
import ClubMapper from '@/shared/mappers/club.mapper';
import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import ClubMembershipMapper from '@/shared/mappers/club-membership.mapper';
import { PaginatedClubDto } from '@/domain/dtos/paginated-output.dto';

@Injectable()
export class ClubRepositoryPrisma implements ClubRepository {
  private readonly select = {
    id: true,
    name: true,
    city: true,
    state: true,
    _count: { select: { memberships: true } },
    created_at: true,
    updated_at: true,
    memberships: true,
    principal_id: true,
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
    const clubs = await this.prisma.club.findMany();
    return clubs.map(ClubMapper.modelToEntity);
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

  async search(query: SearchClubsQueryDto): Promise<PaginatedClubDto> {
    const { page = 1, limit = 10 } = query?.pagination ?? {};
    const where = {
      name: { contains: query.filter?.name, mode: 'insensitive' as const },
      city: { contains: query.filter?.city, mode: 'insensitive' as const },
      state: { contains: query.filter?.state, mode: 'insensitive' as const },
    };
    const total = await this.prisma.club.count({ where });
    const clubsData = await this.prisma.club.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: this.select,
    });
    const clubDtos = clubsData.map((c) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      state: c.state,
      corum: c._count.memberships,
      createdAt: c.created_at,
      principalId: c.principal_id,
    }));

    return {
      data: clubDtos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
