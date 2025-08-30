import { Controller, Post, Get, Body, Param, Query, UseGuards, HttpCode, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserRoles } from '@/domain/enums/user-roles';

import { GetTournament } from '@/application/use-cases/tournament/get-tournament.use-case';
import { ListTournaments } from '@/application/use-cases/tournament/list-tournaments.use-case';
import { CreateTournament } from '@/application/use-cases/tournament/create-tournament.use-case';
import { UpdateTournament } from '@/application/use-cases/tournament/update-tournament.use-case';
import { DeleteTournament } from '@/application/use-cases/tournament/delete-tournament.use-case';
import { CancelRegistration } from '@/application/use-cases/tournament/cancel-registration.use-case';
import { AcceptDuoRegistration } from '@/application/use-cases/tournament/accept-duo-registration.use-case';
import { RejectDuoRegistration } from '@/application/use-cases/tournament/reject-duo-registration.use-case';
import { TournamentDetailsView } from '@/application/queries/tournament-query/tournament-details.view';
import { TournamentListItemView } from '@/application/queries/tournament-query/tournament-list-item.view';
import { RequestDuoRegistration } from '@/application/use-cases/tournament/request-duo-registration.use-case';
import { GetMyPendingRegistrations } from '@/application/use-cases/tournament/get-my-pending-registrations.use-case';
import { RequestIndividualRegistration } from '@/application/use-cases/tournament/request-individual-registration/request-individual-registration.use-case';
import { GetMyPendingRegistrationsListItemView } from '@/application/queries/tournament-query/get-my-pending-registrations-list-item.view';

import { CreateTournamentDto } from '@/infraestructure/dtos/tournament/create-tournament.dto';
import { UpdateTournamentDto } from '@/infraestructure/dtos/tournament/update-tournament.dto';
import { CancelRegistrationDto } from '@/infraestructure/dtos/tournament/cancel-registration.dto';
import { TournamentResponseDto } from '@/infraestructure/dtos/tournament/tournament-response.dto';
import { ListTournamentsQueryDto } from '@/infraestructure/dtos/tournament/list-tournaments-query.dto';
import { AcceptDuoRegistrationResponseDto } from '@/infraestructure/dtos/tournament/accept-duo-registration.dto';
import { RejectDuoRegistrationResponseDto } from '@/infraestructure/dtos/tournament/reject-duo-registration.dto';
import { RequestDuoRegistrationDto, RequestDuoRegistrationOutputDto } from '@/infraestructure/dtos/tournament/request-duo-registration.dto';
import {
  RequestIndividualRegistrationInputDto,
  RequestIndividualRegistrationOutputDto,
} from '@/infraestructure/dtos/tournament/request-individual-registration.dto';

import AuthGuard from '@/shared/guards/auth.guard';
import { Roles } from '@/shared/decorators/role.decorator';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { HttpUser } from '../club-request.controller';

@ApiTags('Torneios')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('tournaments')
export default class TournamentController {
  constructor(
    private readonly getTournament: GetTournament,
    private readonly listTournaments: ListTournaments,
    private readonly createTournament: CreateTournament,
    private readonly updateTournament: UpdateTournament,
    private readonly deleteTournament: DeleteTournament,
    private readonly cancelRegistration: CancelRegistration,
    private readonly acceptDuoRegistration: AcceptDuoRegistration,
    private readonly rejectDuoRegistration: RejectDuoRegistration,
    private readonly requestDuoRegistration: RequestDuoRegistration,
    private readonly getMyPendingRegistrations: GetMyPendingRegistrations,
    private readonly requestIndividualRegistration: RequestIndividualRegistration,
  ) {}

  @Post('create')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Cria um novo torneio' })
  @ApiResponse({ status: 201, description: 'Torneio criado com sucesso.', type: TournamentResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  async create(@Body() createTournamentDto: CreateTournamentDto): Promise<TournamentResponseDto> {
    const tournament = await this.createTournament.execute({
      name: createTournamentDto.name,
      description: createTournamentDto.description,
      type: createTournamentDto.type,
      registrationStartDate: new Date(createTournamentDto.registrationStartDate),
      registrationEndDate: new Date(createTournamentDto.registrationEndDate),
      startDate: new Date(createTournamentDto.startDate),
    });

    return {
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      type: tournament.type,
      registrationStartDate: tournament.registrationStartDate,
      registrationEndDate: tournament.registrationEndDate,
      startDate: tournament.startDate,
      createdAt: tournament.createdAt,
      updatedAt: tournament.updatedAt,
      deletedAt: tournament.deletedAt,
    };
  }

  @Post(':id/update')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Atualiza um torneio existente' })
  @ApiResponse({ status: 200, description: 'Torneio atualizado com sucesso.', type: TournamentResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Torneio não encontrado.' })
  async update(@Param('id') id: string, @Body() updateTournamentDto: UpdateTournamentDto): Promise<TournamentResponseDto> {
    const tournament = await this.updateTournament.execute({
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
    return {
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      type: tournament.type,
      registrationStartDate: tournament.registrationStartDate,
      registrationEndDate: tournament.registrationEndDate,
      startDate: tournament.startDate,
      createdAt: tournament.createdAt,
      updatedAt: tournament.updatedAt,
      deletedAt: tournament.deletedAt,
    };
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

  @Get('my-pending-registrations')
  @ApiOperation({ summary: 'Lista inscrições de dupla pendentes para meus dependentes' })
  @ApiResponse({ status: 200, description: 'Lista de inscrições pendentes retornada com sucesso.', type: [GetMyPendingRegistrationsListItemView] })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  async listMyPendingRegistrations(@Request() req: HttpUser): Promise<GetMyPendingRegistrationsListItemView[]> {
    const holderId = req.user.id;
    return await this.getMyPendingRegistrations.execute(holderId);
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

  @Post('registrations/request-individual')
  @ApiOperation({ summary: 'Solicita inscrição individual em um torneio' })
  @ApiResponse({ status: 201, description: 'Inscrição realizada com sucesso.', type: RequestIndividualRegistrationOutputDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'Competidor já está inscrito neste torneio.' })
  @ApiResponse({ status: 404, description: 'Torneio ou competidor não encontrado.' })
  async registerIndividualCompetitor(@Body() dto: RequestIndividualRegistrationInputDto): Promise<RequestIndividualRegistrationOutputDto> {
    const registration = await this.requestIndividualRegistration.execute({
      tournamentId: dto.tournamentId,
      competitorId: dto.competitorId,
    });
    return {
      registrationId: registration.id,
      status: registration.status,
    };
  }

  @Post('registrations/request-duo')
  @ApiOperation({ summary: 'Solicita inscrição de dupla em um torneio' })
  @ApiResponse({ status: 201, description: 'Solicitação de inscrição de dupla criada com sucesso.', type: RequestDuoRegistrationOutputDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'Competidor ou parceiro já está inscrito neste torneio.' })
  @ApiResponse({ status: 404, description: 'Torneio, competidor ou parceiro não encontrado.' })
  async requestDuoCompetitorRegistration(@Body() dto: RequestDuoRegistrationDto): Promise<RequestDuoRegistrationOutputDto> {
    const registration = await this.requestDuoRegistration.execute({
      tournamentId: dto.tournamentId,
      competitorId: dto.competitorId,
      partnerId: dto.partnerId,
    });
    return {
      registrationId: registration.id,
      status: registration.status,
    };
  }

  @Post('registrations/:id/accept')
  @Roles(UserRoles.DONO_DE_CLUBE)
  @HttpCode(200)
  @ApiOperation({ summary: 'Aceita uma inscrição de dupla pendente' })
  @ApiResponse({ status: 200, description: 'Inscrição de dupla aceita com sucesso.', type: AcceptDuoRegistrationResponseDto })
  @ApiResponse({ status: 400, description: 'Registro não está pendente de aprovação.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Torneio ou registro não encontrado.' })
  async acceptDuoCompetitorRegistration(@Param('id') registrationId: string, @Request() req: HttpUser): Promise<AcceptDuoRegistrationResponseDto> {
    await this.acceptDuoRegistration.execute({
      registrationId,
      userId: req.user.id,
    });

    return {
      message: 'Inscrição de dupla aceita com sucesso',
    };
  }

  @Post('registrations/:id/reject')
  @Roles(UserRoles.DONO_DE_CLUBE)
  @HttpCode(200)
  @ApiOperation({ summary: 'Rejeita uma inscrição de dupla pendente' })
  @ApiResponse({ status: 200, description: 'Inscrição de dupla rejeitada com sucesso.', type: RejectDuoRegistrationResponseDto })
  @ApiResponse({ status: 400, description: 'Registro não está pendente de aprovação.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Torneio ou registro não encontrado.' })
  async rejectDuoCompetitorRegistration(@Param('id') registrationId: string, @Request() req: HttpUser): Promise<RejectDuoRegistrationResponseDto> {
    await this.rejectDuoRegistration.execute({
      registrationId,
      userId: req.user.id,
    });

    return {
      message: 'Inscrição de dupla rejeitada com sucesso',
    };
  }

  @Post('registrations/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancela uma inscrição em torneio' })
  @ApiResponse({ status: 200, description: 'Inscrição cancelada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 404, description: 'Inscrição não encontrada.' })
  //todo: create a dto as infra/controllers/[specificfolder]/dtos/ and doc it (openapi) for better documentation. must be a class using class validator and openapi docs. one file, input and output dtos.
  async cancelCompetitorRegistration(@Body() dto: CancelRegistrationDto): Promise<{ message: string }> {
    await this.cancelRegistration.execute({
      registrationId: dto.registrationId,
      reason: dto.reason,
    });

    return {
      message: 'Inscrição cancelada com sucesso',
    };
  }
}
