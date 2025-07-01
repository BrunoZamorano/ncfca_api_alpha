import ClubRepository from '../../domain/repositories/club-repository';
import Club from '../../domain/entities/club/club';

export default class ClubRepositoryMemory implements ClubRepository {
  private clubs: Club[];

  constructor(clubs?: Club[]) {
    this.clubs = clubs ?? this.populate();
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

  private populate(): Club[] {
    return Array.from({ length: 10 }, (_, i) => new Club({ ownerId: `${++i}`, id: `${i}` }));
  }
}
