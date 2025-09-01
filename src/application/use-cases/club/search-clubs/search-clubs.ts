import { Inject } from '@nestjs/common';

import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import { PaginatedClubDto } from '@/domain/dtos/paginated-output.dto';

import { ClubQuery } from '@/application/queries/club-query/club.query';

import { CLUB_QUERY } from '@/shared/constants/query-constants';

export default class SearchClubs {
  constructor(@Inject(CLUB_QUERY) private readonly _clubQuery: ClubQuery) {}

  async execute(input: SearchClubsQueryDto): Promise<PaginatedClubDto> {
    return await this._clubQuery.search(input);
  }
}
