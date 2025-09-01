import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { EnrollmentRequestDto } from '@/domain/dtos/enrollment-request.dto';
import { ClubMemberDto } from '@/domain/dtos/club-member.dto';
import { UserRoles } from '@/domain/enums/user-roles';
import ClubDto from '@/domain/dtos/club.dto';

import ListPendingEnrollments from '@/application/use-cases/club-management/list-pending-enrollments/list-pending-enrollments';
import ListMembersOfMyClub from '@/application/use-cases/club/list-members-of-my-club/list-members-of-my-club';
import ListAllEnrollments from '@/application/use-cases/club-management/list-all-enrollments/list-all-enrollments';
import ApproveEnrollment from '@/application/use-cases/club-management/approve-enrollment/approve-enrollment';
import RejectEnrollment from '@/application/use-cases/club-management/reject-enrollment/reject-enrollment';
import RemoveClubMember from '@/application/use-cases/club/remove-club-member/remove-club-member';
import UpdateClubInfo from '@/application/use-cases/club/update-club-info/update-club-info';
import GetMyClubInfo from '@/application/use-cases/club/get-my-club-info/get-my-club-info';

import { ListPendingEnrollmentsOutputDto } from '@/infraestructure/dtos/list-pending-enrollments.dto';
import { RejectEnrollmentDto } from '@/infraestructure/dtos/reject-enrollment.dto';
import { UpdateClubDto } from '@/infraestructure/dtos/update-club.dto';

import { RolesGuard } from '@/shared/guards/roles.guard';
import { Roles } from '@/shared/decorators/role.decorator';
import AuthGuard from '@/shared/guards/auth.guard';

import { HttpUser } from '../club-request.controller';

@ApiTags('Gestão de Clube (Diretor)')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRoles.DONO_DE_CLUBE)
@Controller('')
export default class ClubManagementController {
  constructor(
    private readonly _listPendingEnrollments: ListPendingEnrollments,
    private readonly _listMembersOfMyClub: ListMembersOfMyClub,
    private readonly _listAllEnrollments: ListAllEnrollments,
    private readonly _approveEnrollment: ApproveEnrollment,
    private readonly _rejectEnrollment: RejectEnrollment,
    private readonly _removeClubMember: RemoveClubMember,
    private readonly _updateClubInfo: UpdateClubInfo,
    private readonly _getMyClubInfo: GetMyClubInfo,
  ) {}

  @Get('my-club')
  @ApiOperation({ summary: 'Obtém as informações do clube do diretor autenticado' })
  @ApiResponse({ status: 200, description: 'Dados do clube retornados com sucesso.', type: ClubDto })
  async getMyClubInfo(@Request() req: HttpUser) {
    const input = { loggedInUserId: req.user.id };
    return this._getMyClubInfo.execute(input);
  }

  @Post('my-club')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Atualiza as informações de um clube específico que o usuário dirige' })
  @ApiResponse({ status: 204, description: 'Clube atualizado com sucesso.' })
  async updateClub(@Request() req: HttpUser, @Body() body: UpdateClubDto): Promise<void> {
    await this._updateClubInfo.execute({
      principalId: req.user.id,
      address: body.address,
      ...body,
    });
  }

  @Get('/my-club/enrollments')
  @ApiOperation({ summary: 'Lista todas as solicitações de matrícula para o clube do usuário logado.' })
  @ApiResponse({ status: 200, description: 'Lista de solicitações pendentes.', type: [EnrollmentRequestDto] })
  async listEnrollments(@Request() req: HttpUser) {
    return this._listAllEnrollments.execute({ loggedInUserId: req.user.id });
  }

  @Get('/my-club/enrollments/pending')
  @ApiOperation({ summary: 'Lista as solicitações de matrícula pendentes para um clube específico' })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitações pendentes.',
    type: [ListPendingEnrollmentsOutputDto],
  })
  async listPending(@Request() req: HttpUser) {
    return this._listPendingEnrollments.execute({ principalId: req.user.id });
  }

  @Get('/my-club/members')
  @ApiOperation({ summary: 'Lista todos os membros ativos do meu clube' })
  @ApiResponse({ status: 200, description: 'Lista de membros ativos.', type: [ClubMemberDto] }) // Nota: Deveria ser um DTO de Membro, mas usando o de request por ora.
  async listMembersOfMyClub(@Request() req: HttpUser) {
    return this._listMembersOfMyClub.execute({ loggedInUserId: req.user.id });
  }

  @Post('/enrollments/:enrollmentId/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Aprova uma solicitação de matrícula' })
  @ApiResponse({ status: 204, description: 'Matrícula aprovada com sucesso.' })
  async approve(@Request() req: HttpUser, @Param('enrollmentId') enrollmentId: string) {
    await this._approveEnrollment.execute({ loggedInUserId: req.user.id, enrollmentRequestId: enrollmentId });
  }

  @Post('/enrollments/:enrollmentId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Rejeita uma solicitação de matrícula' })
  @ApiResponse({ status: 204, description: 'Matrícula rejeitada com sucesso.' })
  async reject(@Request() req: HttpUser, @Param('enrollmentId') enrollmentId: string, @Body() body: RejectEnrollmentDto) {
    await this._rejectEnrollment.execute({
      loggedInUserId: req.user.id,
      enrollmentRequestId: enrollmentId,
      reason: body.reason,
    });
  }

  @Post('/membership/:membershipId/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoga a afiliação de um membro do clube' })
  @ApiResponse({ status: 204, description: 'Afiliação do membro revogada com sucesso.' })
  async removeMember(@Request() req: HttpUser, @Param('membershipId') membershipId: string) {
    await this._removeClubMember.execute({ loggedInUserId: req.user.id, membershipId: membershipId });
  }
}
