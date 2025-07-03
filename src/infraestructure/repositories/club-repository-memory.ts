import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import PaginatedOutputDto from '@/domain/dtos/paginated-output.dto';
import ClubRepository from '@/domain/repositories/club-repository';
import ClubDto from '@/domain/dtos/club.dto';
import Club from '@/domain/entities/club/club';

import ClubMapper from '@/shared/mappers/club.mapper';

export default class ClubRepositoryMemory implements ClubRepository {
  private clubs: Club[];

  constructor({ clubs, options }: { clubs?: Club[]; options?: Options }) {
    this.clubs = clubs ?? this.populate(options?.totalClubs);
  }

  async search(query: SearchClubsQueryDto): Promise<PaginatedOutputDto<ClubDto>> {
    const { page = 1, limit = 10 } = query?.pagination ?? {};
    const filters = query?.filter;
    let filteredClubs = this.clubs;
    if (filters) {
      if (filters.name) {
        const name = filters.name.toLocaleLowerCase();
        filteredClubs = filteredClubs.filter((club) => club.name.toLocaleLowerCase().includes(name));
      }
      if (filters.city) {
        const city = filters.city.toLocaleLowerCase();
        filteredClubs = filteredClubs.filter((club) => club.city.toLocaleLowerCase() === city);
      }
    }
    const total = filteredClubs.length;
    const offset = (page - 1) * limit;
    const paginatedItems = filteredClubs.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);
    const formatedItems = paginatedItems.map((entity) => ClubMapper.entityToDto(entity));
    return {
      data: formatedItems,
      meta: {
        totalPages,
        total,
        limit,
        page,
      },
    };
  }

  async update(club: Club): Promise<Club> {
    const index = this.clubs.findIndex((p) => p.id === club.id);
    if (index === -1) throw new Error('CLUB_NOT_FOUND');
    this.clubs[index] = club;
    const updatedClub = await this.find(club.id);
    if (!updatedClub) throw new Error('CLUB_NOT_UPDATED');
    return updatedClub;
  }

  async create(club: Club): Promise<Club> {
    this.clubs.push(club);
    const createdClub = await this.find(club.id);
    if (!createdClub) throw new Error('CLUB_NOT_CREATED');
    return createdClub;
  }

  async findByOwnerId(ownerId: string): Promise<Club | null> {
    return this.clubs.find((p) => p.ownerId === ownerId) ?? null;
  }

  async find(id: string): Promise<Club | null> {
    return this.clubs.find((c) => c.id === id) ?? null;
  }

  private populate(totalClubs: number = 10): Club[] {
    return Array.from({ length: totalClubs }, (_, i) => new Club({ ownerId: `${++i}`, id: `${i}` }));
  }
}

interface Options {
  totalClubs?: number;
}
