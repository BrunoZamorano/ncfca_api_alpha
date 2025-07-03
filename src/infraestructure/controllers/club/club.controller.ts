import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';

import SearchClubs from '@/application/use-cases/search-clubs/search-clubs';

import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import PaginatedOutputDto from '@/domain/dtos/paginated-output.dto';
import ClubDto from '@/domain/dtos/club.dto';

import AuthGuard from '@/shared/guards/auth.guard';

@Controller('club')
export default class ClubController {
  constructor(private readonly _searchClubs: SearchClubs) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async searchClubs(@Query() query: SearchClubsQueryDto): Promise<PaginatedOutputDto<ClubDto>> {
    return this._searchClubs.execute(query);
  }
}
