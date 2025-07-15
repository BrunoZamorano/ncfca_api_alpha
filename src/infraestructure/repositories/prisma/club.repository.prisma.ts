import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import ClubRepository from '@/domain/repositories/club-repository';
import Club from '@/domain/entities/club/club';
import ClubMapper from '@/shared/mappers/club.mapper';
import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import PaginatedOutputDto from '@/domain/dtos/paginated-output.dto';
import ClubDto from '@/domain/dtos/club.dto';

@Injectable()
export class ClubRepositoryPrisma implements ClubRepository {
  constructor(private readonly prisma: PrismaService) {}

  async find(id: string): Promise<Club | null> {
    if (!id) return null;
    const club = await this.prisma.club.findUnique({ where: { id } });
    return club ? ClubMapper.toEntity(club) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Club | null> {
    if (!ownerId) return null;
    const club = await this.prisma.club.findUnique({ where: { principal_id: ownerId } });
    return club ? ClubMapper.toEntity(club) : null;
  }

  async findAll(): Promise<Club[]> {
    const clubs = await this.prisma.club.findMany();
    return clubs.map(ClubMapper.toEntity);
  }

  async save(club: Club): Promise<Club> {
    const clubData = ClubMapper.toModel(club);
    const savedClub = await this.prisma.club.upsert({
      where: { id: club.id },
      update: clubData,
      create: clubData,
    });
    return ClubMapper.toEntity(savedClub);
  }

  async search(query: SearchClubsQueryDto): Promise<PaginatedOutputDto<ClubDto>> {
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
      ownerId: c.principal_id,
      affiliatedFamilies: [],
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
