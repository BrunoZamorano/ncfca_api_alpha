import { Inject } from '@nestjs/common';

import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import { PaginatedClubDto } from '@/domain/dtos/paginated-output.dto';
import ClubRepository from '@/domain/repositories/club-repository';

import { CLUB_REPOSITORY } from '@/shared/constants/repository-constants';

export default class SearchClubs {
  constructor(@Inject(CLUB_REPOSITORY) private readonly _clubRepository: ClubRepository) {}

  async execute(input: SearchClubsQueryDto): Promise<PaginatedClubDto> {
    return this._clubRepository.search(input);
  }
}
