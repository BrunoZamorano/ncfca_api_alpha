import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import ApproveClubRequest from '@/application/use-cases/club-request/approve-club-request/approve-club-request.use-case';
import RejectClubRequestUseCase from '@/application/use-cases/club-request/reject-club-request/reject-club-request.use-case';
import CreateClubRequestUseCase from '@/application/use-cases/club-request/create-club-request/create-club-request.use-case';
import GetUserClubRequestsUseCase from '@/application/use-cases/club-request/get-user-club-requests/get-user-club-requests.use-case';
import ListPendingClubRequestsUseCase from '@/application/use-cases/club-request/list-pending-club-requests/list-pending-club-requests.use-case';

import { RejectRequestDto } from '@/infraestructure/dtos/reject-request.dto';
import { CreateClubRequestDto } from '@/infraestructure/dtos/create-club-request.dto';
import { ClubRequestStatusDto } from '@/domain/dtos/club-request-status.dto';
import { AdminGuard } from '@/shared/guards/admin.guard';
import AuthGuard from '@/shared/guards/auth.guard';
import { UserRoles } from '@/domain/enums/user-roles';

@ApiTags('Clubes - Solicitações')
@Controller('club-requests')
export default class ClubRequestController {
  constructor(
    private readonly listPendingClubRequestsUseCase: ListPendingClubRequestsUseCase,
    private readonly getUserClubRequestsUseCase: GetUserClubRequestsUseCase,
    private readonly approveClubRequestUseCase: ApproveClubRequest,
    private readonly createClubRequestUseCase: CreateClubRequestUseCase,
    private readonly rejectClubRequestUseCase: RejectClubRequestUseCase,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Submete uma nova solicitação para criação de clube (Usuário)' })
  @ApiResponse({ status: 202, description: 'Solicitação recebida e pendente de aprovação.' })
  async create(@Request() req: HttpUser, @Body() body: CreateClubRequestDto): Promise<void> {
    const loggedInUserId = req.user.id;
    await this.createClubRequestUseCase.execute({ ...body, requesterId: loggedInUserId });
  }

  @Get('/my-requests')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lista as solicitações de clube do usuário autenticado (Usuário)' })
  @ApiResponse({ status: 200, type: [ClubRequestStatusDto] })
  async getMyRequests(@Request() req: HttpUser): Promise<ClubRequestStatusDto[]> {
    return this.getUserClubRequestsUseCase.execute(req.user.id);
  }

  @Get('/pending')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lista todas as solicitações de clube pendentes (Admin)' })
  @ApiResponse({ status: 200, type: [ClubRequestStatusDto] })
  async listPending(): Promise<ClubRequestStatusDto[]> {
    return this.listPendingClubRequestsUseCase.execute();
  }

  @Post('/:id/approve')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Aprova uma solicitação de clube (Admin)' })
  @ApiResponse({ status: 204, description: 'Solicitação aprovada.' })
  async approve(@Param('id') id: string): Promise<void> {
    await this.approveClubRequestUseCase.execute({ clubRequestId: id });
  }

  @Post('/:id/reject')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Rejeita uma solicitação de clube (Admin)' })
  @ApiResponse({ status: 204, description: 'Solicitação rejeitada.' })
  async reject(@Param('id') id: string, @Body() body: RejectRequestDto): Promise<void> {
    await this.rejectClubRequestUseCase.execute({ clubRequestId: id, reason: body.reason });
  }
}

//todo: move it to its own file in shared/types/
export type HttpUser = { user: { id: string; roles: UserRoles[] } };
