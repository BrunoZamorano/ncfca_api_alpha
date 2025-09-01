import { Controller, Get, Query, UseGuards, Request, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PaginatedClubDto } from '@/domain/dtos/paginated-output.dto';
import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import ClubDto from '@/domain/dtos/club.dto';

import SearchClubs from '@/application/use-cases/club/search-clubs/search-clubs';
import GetClubInfo from '@/application/use-cases/club/get-club-info/get-club-info';

import AuthGuard from '@/shared/guards/auth.guard';

import { HttpUser } from '../club-request.controller';

@ApiTags('Clubes')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('club')
export default class ClubController {
  constructor(
    private readonly _searchClubs: SearchClubs,
    private readonly _getClubInfo: GetClubInfo,
  ) {}

  //todo: affiliationGuard
  @Get()
  @ApiOperation({ summary: 'Busca e lista clubes com paginação e filtros' })
  @ApiResponse({ status: 200, description: 'Lista de clubes retornada com sucesso.', type: PaginatedClubDto })
  async searchClubs(@Query() query: SearchClubsQueryDto): Promise<PaginatedClubDto> {
    return this._searchClubs.execute(query);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Obtém informações detalhadas de um clube específico' })
  @ApiResponse({ status: 200, description: 'Dados do clube retornados com sucesso.', type: ClubDto })
  @ApiResponse({ status: 404, description: 'Clube não encontrado.' })
  async getClubInfo(@Request() req: HttpUser, @Param('id') id: string): Promise<ClubDto> {
    const userId: string = req['user'].id;
    return this._getClubInfo.execute({ loggedInUserId: userId, clubId: id });
  }
}
