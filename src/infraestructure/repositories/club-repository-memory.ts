import ClubRepository from '@/domain/repositories/club-repository';
import Address from '@/domain/value-objects/address/address';
import Club from '@/domain/entities/club/club';

import InMemoryDatabase from '@/infraestructure/database/in-memory.database';

export default class ClubRepositoryMemory implements ClubRepository {
  private db: InMemoryDatabase;

  public constructor({ clubs, options }: { clubs?: Club[]; options?: Options }) {
    this.db = InMemoryDatabase.getInstance();
    const initialClubs = clubs ?? this.populate(options?.totalClubs);
    this.db.clubs.push(...initialClubs);
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
