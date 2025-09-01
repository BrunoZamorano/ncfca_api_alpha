import Club from '@/domain/entities/club/club';

export default interface ClubRepository {
  save(club: Club): Promise<Club>;
  find(id: string): Promise<Club | null>;
  findAll(): Promise<Club[]>;
  findByPrincipalId(ownerId: string): Promise<Club | null>;
}
