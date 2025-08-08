import { Body, Controller, HttpCode, HttpStatus, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import ApproveClubRequest from '@/application/use-cases/club-request/approve-club-request/approve-club-request.use-case';

import { AdminGuard } from '@/shared/guards/admin.guard';
import AuthGuard from '@/shared/guards/auth.guard';
import RejectClubRequestUseCase from '@/application/use-cases/club-request/reject-club-request/reject-club-request.use-case';
import { RejectRequestDto } from '@/infraestructure/dtos/reject-request.dto';

@ApiTags('Admin - Gerenciamento de Solicitações de Clube')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/club-requests')
export default class AdminClubRequestController {
  constructor(
    @Inject(ApproveClubRequest) private readonly approveClubRequestUseCase: ApproveClubRequest,
    @Inject(RejectClubRequestUseCase) private readonly rejectClubRequestUseCase: RejectClubRequestUseCase,
  ) {}

  @Post('/:id/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Aprova uma solicitação de clube pendente' })
  @ApiResponse({ status: 204, description: 'Solicitação aprovada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada.' })
  async approve(@Param('id') id: string): Promise<void> {
    await this.approveClubRequestUseCase.execute({ clubRequestId: id });
  }

  @Post('/:id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Rejeita uma solicitação de clube pendente' })
  @ApiResponse({ status: 204, description: 'Solicitação rejeitada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada.' })
  async reject(@Param('id') id: string, @Body() body: RejectRequestDto): Promise<void> {
    await this.rejectClubRequestUseCase.execute({
      clubRequestId: id,
      reason: body.reason,
    });
  }
}
