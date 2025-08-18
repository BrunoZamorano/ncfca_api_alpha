import { Controller, Get, Post, Body, HttpCode, HttpStatus, Query, UseGuards, Request, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import SearchClubs from '@/application/use-cases/club/search-clubs/search-clubs';
import GetClubInfo from '@/application/use-cases/club/get-club-info/get-club-info';
import CreateClub from '@/application/use-cases/club/create-club/create-club';
import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import ClubDto from '@/domain/dtos/club.dto';
import { PaginatedClubDto } from '@/domain/dtos/paginated-output.dto';
import { CreateClubInputDto, CreateClubOutputDto } from '@/infraestructure/dtos/create-club.dto';
import ClubMapper from '@/shared/mappers/club.mapper';
import AuthGuard from '@/shared/guards/auth.guard';

@ApiTags('Clubes')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('club')
export default class ClubController {
  constructor(
    private readonly _searchClubs: SearchClubs,
    private readonly _getClubInfo: GetClubInfo,
    private readonly _createClub: CreateClub,
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
  async getClubInfo(@Request() req: Request, @Param('id') id: string): Promise<ClubDto> {
    const userId: string = req['user'].id;
    return this._getClubInfo.execute({ loggedInUserId: userId, clubId: id });
  }
}
