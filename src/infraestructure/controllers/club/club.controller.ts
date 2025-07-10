import { Controller, Get, Post, Body, HttpCode, HttpStatus, Query, UseGuards, Request } from '@nestjs/common';

import SearchClubs from '@/application/use-cases/search-clubs/search-clubs';
import CreateClub from '@/application/use-cases/create-club/create-club';

import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import PaginatedOutputDto from '@/domain/dtos/paginated-output.dto';
import ClubDto from '@/domain/dtos/club.dto';
import { CreateClubDto } from '@/infraestructure/dtos/create-club.dto';
import ClubMapper from '@/shared/mappers/club.mapper';

import AuthGuard from '@/shared/guards/auth.guard';

@Controller('club')
@UseGuards(AuthGuard)
export default class ClubController {
  constructor(
    private readonly _searchClubs: SearchClubs,
    private readonly _createClub: CreateClub,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async searchClubs(@Query() query: SearchClubsQueryDto): Promise<PaginatedOutputDto<ClubDto>> {
    return this._searchClubs.execute(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createClub(@Request() req: any, @Body() body: CreateClubDto): Promise<ClubDto> {
    const ownerId = req.user.id;
    const club = await this._createClub.execute({ ...body, ownerId });
    return ClubMapper.entityToDto(club);
  }
}
