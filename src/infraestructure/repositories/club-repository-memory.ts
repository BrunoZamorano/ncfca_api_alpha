import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import { PaginatedClubDto } from '@/domain/dtos/paginated-output.dto';
import ClubRepository from '@/domain/repositories/club-repository';
import Club from '@/domain/entities/club/club';

import InMemoryDatabase from '@/infraestructure/database/in-memory.database';

import ClubMapper from '@/shared/mappers/club.mapper';
import Address from '@/domain/value-objects/address/address';

export default class ClubRepositoryMemory implements ClubRepository {
  private db: InMemoryDatabase;

  public constructor({ clubs, options }: { clubs?: Club[]; options?: Options }) {
    this.db = InMemoryDatabase.getInstance();
    const initialClubs = clubs ?? this.populate(options?.totalClubs);
    this.db.clubs.push(...initialClubs);
  }

  async search(query: SearchClubsQueryDto): Promise<PaginatedClubDto> {
    const { page = 1, limit = 10 } = query?.pagination ?? {};
    const filters = query?.filter;
    let filteredClubs = this.db.clubs;
    if (filters) {
      if (filters.name) {
        const name = filters.name.toLocaleLowerCase();
        filteredClubs = filteredClubs.filter((club) => club.name.toLocaleLowerCase().includes(name));
      }
      if (filters.city) {
        const city = filters.city.toLocaleLowerCase();
        filteredClubs = filteredClubs.filter((club) => club.address.city.toLocaleLowerCase() === city);
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

  async save(club: Club): Promise<Club> {
    const index = this.db.clubs.findIndex((p) => p.id === club.id);
    index === -1 ? this.db.clubs.push(club) : (this.db.clubs[index] = club);
    const updatedClub = await this.find(club.id);
    if (!updatedClub) throw new Error('CLUB_NOT_UPDATED');
    return updatedClub;
  }

  async findByPrincipalId(ownerId: string): Promise<Club | null> {
    return this.db.clubs.find((p) => p.principalId === ownerId) ?? null;
  }

  async find(id: string): Promise<Club | null> {
    return this.db.clubs.find((c) => c.id === id) ?? null;
  }

  async findAll(): Promise<Club[]> {
    return this.db.clubs ?? [];
  }

  public populate(totalClubs: number = 10): Club[] {
    return Array.from({ length: totalClubs }, () =>
      Club.create(
        { principalId: crypto.randomUUID(), address: new Address({}), name: 'name', maxMembers: 30 },
        { generate: () => crypto.randomUUID() },
      ),
    );
  }
}

interface Options {
  totalClubs?: number;
}
