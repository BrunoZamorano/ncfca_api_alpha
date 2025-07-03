import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import PaginatedOutputDto from '@/domain/dtos/paginated-output.dto';
import ClubDto from '@/domain/dtos/club.dto';
import Club from '@/domain/entities/club/club';

export default interface ClubRepository {
  search(query: SearchClubsQueryDto): Promise<PaginatedOutputDto<ClubDto>>;
  create(club: Club): Promise<Club>;
  update(club: Club): Promise<Club>;
  find(id: string): Promise<Club | null>;
}
