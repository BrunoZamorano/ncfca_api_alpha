import Club from '@/domain/entities/club/club';

export default interface ClubRepository {
  create(club: Club): Promise<Club>;

  update(club: Club): Promise<Club>;

  find(id: string): Promise<Club | null>;
}
