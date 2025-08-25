import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateTournament } from '@/application/use-cases/tournament/create-tournament.use-case';
import { UpdateTournament } from '@/application/use-cases/tournament/update-tournament.use-case';
import { DeleteTournament } from '@/application/use-cases/tournament/delete-tournament.use-case';
import { GetTournament } from '@/application/use-cases/tournament/get-tournament.use-case';
import { ListTournaments } from '@/application/use-cases/tournament/list-tournaments.use-case';

import { CreateTournamentDto } from '@/infraestructure/dtos/tournament/create-tournament.dto';
import { UpdateTournamentDto } from '@/infraestructure/dtos/tournament/update-tournament.dto';
import { ListTournamentsQueryDto } from '@/infraestructure/dtos/tournament/list-tournaments-query.dto';

import { TournamentDetailsView } from '@/application/queries/tournament-query/tournament-details.view';
import { TournamentListItemView } from '@/application/queries/tournament-query/tournament-list-item.view';
import Tournament from '@/domain/entities/tournament/tournament.entity';

import AuthGuard from '@/shared/guards/auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { Roles } from '@/shared/decorators/role.decorator';
import { UserRoles } from '@/domain/enums/user-roles';

@ApiTags('Torneios')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('tournaments')
export default class TournamentController {
  constructor(
    private readonly createTournament: CreateTournament,
    private readonly updateTournament: UpdateTournament,
    private readonly deleteTournament: DeleteTournament,
    private readonly getTournament: GetTournament,
    private readonly listTournaments: ListTournaments,
  ) {}

  @Post('create')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Cria um novo torneio' })
  @ApiResponse({ status: 201, description: 'Torneio criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  async create(@Body() createTournamentDto: CreateTournamentDto): Promise<Tournament> {
    return await this.createTournament.execute({
      name: createTournamentDto.name,
      description: createTournamentDto.description,
      type: createTournamentDto.type,
      registrationStartDate: new Date(createTournamentDto.registrationStartDate),
      registrationEndDate: new Date(createTournamentDto.registrationEndDate),
      startDate: new Date(createTournamentDto.startDate),
    });
  }

  @Post(':id/update')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Atualiza um torneio existente' })
  @ApiResponse({ status: 200, description: 'Torneio atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Torneio não encontrado.' })
  async update(
    @Param('id') id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
  ): Promise<Tournament> {
    return await this.updateTournament.execute({
      id,
      data: {
        name: updateTournamentDto.name,
        description: updateTournamentDto.description,
        type: updateTournamentDto.type,
        registrationStartDate: updateTournamentDto.registrationStartDate ? new Date(updateTournamentDto.registrationStartDate) : undefined,
        registrationEndDate: updateTournamentDto.registrationEndDate ? new Date(updateTournamentDto.registrationEndDate) : undefined,
        startDate: updateTournamentDto.startDate ? new Date(updateTournamentDto.startDate) : undefined,
      },
    });
  }

  @Post(':id/delete')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Remove um torneio (soft delete)' })
  @ApiResponse({ status: 200, description: 'Torneio removido com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Torneio não encontrado.' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteTournament.execute(id);
  }

  @Get()
  @Roles(UserRoles.ADMIN, UserRoles.DONO_DE_CLUBE)
  @ApiOperation({ summary: 'Lista torneios com filtros e paginação' })
  @ApiResponse({ status: 200, description: 'Lista de torneios retornada com sucesso.', type: [TournamentListItemView] })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  async list(@Query() query: ListTournamentsQueryDto): Promise<TournamentListItemView[]> {
    return await this.listTournaments.execute(query);
  }

  @Get(':id')
  @Roles(UserRoles.ADMIN, UserRoles.DONO_DE_CLUBE)
  @ApiOperation({ summary: 'Obtém detalhes de um torneio específico' })
  @ApiResponse({ status: 200, description: 'Detalhes do torneio retornados com sucesso.', type: TournamentDetailsView })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Torneio não encontrado.' })
  async getById(@Param('id') id: string): Promise<TournamentDetailsView> {
    return await this.getTournament.execute(id);
  }
}