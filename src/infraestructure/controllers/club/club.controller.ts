import { Controller, Get, Post, Body, HttpCode, HttpStatus, Query, UseGuards, Request, Param } from '@nestjs/common';

import SearchClubs from '@/application/use-cases/search-clubs/search-clubs';
import GetClubInfo from '@/application/use-cases/get-club-info/get-club-info';
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
    private readonly _getClubInfo: GetClubInfo,
    private readonly _createClub: CreateClub,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async searchClubs(@Query() query: SearchClubsQueryDto): Promise<PaginatedOutputDto<ClubDto>> {
    return this._searchClubs.execute(query);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  async getClubInfo(@Request() req: Request, @Param('id') id: string): Promise<ClubDto> {
    const userId: string = req['user'].sub;
    return this._getClubInfo.execute({ loggedInUserId: userId, clubId: id });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createClub(@Request() req: any, @Body() body: CreateClubDto): Promise<ClubDto> {
    const loggedInUserId = req.user.id;
    const club = await this._createClub.execute({ ...body, loggedInUserId });
    return ClubMapper.entityToDto(club);
  }
}
