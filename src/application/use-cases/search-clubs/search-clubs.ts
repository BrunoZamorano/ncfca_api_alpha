import { Inject } from '@nestjs/common';

import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import PaginatedOutputDto from '@/domain/dtos/paginated-output.dto';
import ClubRepository from '@/domain/repositories/club-repository';
import ClubDto from '@/domain/dtos/club.dto';

import { CLUB_REPOSITORY } from '@/shared/constants/repository-constants';

export default class SearchClubs {
  constructor(@Inject(CLUB_REPOSITORY) private readonly _clubRepository: ClubRepository) {}

  async execute(input: SearchClubsQueryDto): Promise<PaginatedOutputDto<ClubDto>> {
    return this._clubRepository.search(input);
  }
}
