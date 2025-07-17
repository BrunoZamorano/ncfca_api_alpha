import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import { PaginatedClubDto } from '@/domain/dtos/paginated-output.dto';
import Club from '@/domain/entities/club/club';

export default interface ClubRepository {
  search(query: SearchClubsQueryDto): Promise<PaginatedClubDto>;
  save(club: Club): Promise<Club>;
  find(id: string): Promise<Club | null>;
  findAll(): Promise<Club[]>;
  findByOwnerId(ownerId: string): Promise<Club | null>;
}
