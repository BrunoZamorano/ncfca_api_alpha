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
  constructor(private readonly prisma: PrismaService) {}

  async find(id: string): Promise<Club | null> {
    if (!id) return null;
    const club = await this.prisma.club.findUnique({ where: { id }, include: { memberships: true } });
    return club ? ClubMapper.modelToEntity(club) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Club | null> {
    if (!ownerId) return null;
    const club = await this.prisma.club.findUnique({ where: { principal_id: ownerId } });
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

    let upsertedClub;
    await this.prisma.$transaction([
      (upsertedClub = this.prisma.club.upsert({
        where: { id: club.id },
        update: clubData,
        create: clubData,
      })),
      ...memberOperations,
    ]);
    return ClubMapper.modelToEntity(upsertedClub);
  }

  async search(query: SearchClubsQueryDto): Promise<PaginatedClubDto> {
    const { page = 1, limit = 10 } = query?.pagination ?? {};
    const where = {
      name: { contains: query.filter?.name },
      city: { contains: query.filter?.city },
    };
    const total = await this.prisma.club.count({ where });
    const clubsData = await this.prisma.club.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
    });
    const clubDtos = clubsData.map((c) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      state: c.state,
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
