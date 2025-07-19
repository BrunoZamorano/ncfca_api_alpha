// src/infraestructure/controllers/club-management.controller.ts

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import ListPendingEnrollments from '@/application/use-cases/list-pending-enrollments/list-pending-enrollments';
import ApproveEnrollment from '@/application/use-cases/approve-enrollment/approve-enrollment';
import RejectEnrollment from '@/application/use-cases/reject-enrollment/reject-enrollment';
import RemoveClubMember from '@/application/use-cases/remove-club-member/remove-club-member';
import UpdateClubInfo from '@/application/use-cases/update-club-info/update-club-info';
import GetMyClubInfo from '@/application/use-cases/get-my-club-info/get-my-club-info';
import { UserRoles } from '@/domain/enums/user-roles';
import { RejectEnrollmentDto } from '@/infraestructure/dtos/reject-enrollment.dto';
import { UpdateClubDto } from '@/infraestructure/dtos/update-club.dto';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { Roles } from '@/shared/decorators/role.decorator';
import AuthGuard from '@/shared/guards/auth.guard';
import ListMembersOfMyClub from '@/application/use-cases/list-members-of-my-club/list-members-of-my-club';
import ClubDto from '@/domain/dtos/club.dto';
import { EnrollmentRequestDto } from '@/domain/dtos/enrollment-request.dto';
import { ClubMemberDto } from '@/domain/dtos/club-member.dto';

@ApiTags('5. Gestão de Clube (Diretor)')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRoles.DONO_DE_CLUBE)
@Controller('club-management')
export default class ClubManagementController {
  constructor(
    private readonly _listPendingEnrollments: ListPendingEnrollments,
    private readonly _approveEnrollment: ApproveEnrollment,
    private readonly _rejectEnrollment: RejectEnrollment,
    private readonly _listMembersOfMyClub: ListMembersOfMyClub,
    private readonly _removeClubMember: RemoveClubMember,
    private readonly _updateClubInfo: UpdateClubInfo,
    private readonly _getMyClubInfo: GetMyClubInfo,
  ) {}

  @Get('my-club')
  @ApiOperation({ summary: 'Obtém as informações do clube do diretor autenticado' })
  @ApiResponse({ status: 200, description: 'Dados do clube retornados com sucesso.', type: ClubDto })
  async getMyClubInfo(@Request() req: any) {
    const input = { loggedInUserId: req.user.id };
    return this._getMyClubInfo.execute(input);
  }

  @Patch(':clubId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Atualiza as informações de um clube específico que o usuário dirige' })
  @ApiResponse({ status: 204, description: 'Clube atualizado com sucesso.' })
  async updateClub(@Request() req: any, @Param('clubId') clubId: string, @Body() body: UpdateClubDto): Promise<void> {
    await this._updateClubInfo.execute({
      loggedInUserId: req.user.id,
      clubId,
      ...body,
    });
  }

  @Get(':clubId/enrollments/pending')
  @ApiOperation({ summary: 'Lista as solicitações de matrícula pendentes para um clube específico' })
  @ApiResponse({ status: 200, description: 'Lista de solicitações pendentes.', type: [EnrollmentRequestDto] })
  async listPending(@Request() req: any, @Param('clubId') clubId: string) {
    return this._listPendingEnrollments.execute({ loggedInUserId: req.user.id, clubId });
  }

  @Post('/enrollments/:enrollmentId/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Aprova uma solicitação de matrícula' })
  @ApiResponse({ status: 204, description: 'Matrícula aprovada com sucesso.' })
  async approve(@Request() req: any, @Param('enrollmentId') enrollmentId: string) {
    await this._approveEnrollment.execute({ loggedInUserId: req.user.id, enrollmentRequestId: enrollmentId });
  }

  @Post('/enrollments/:enrollmentId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Rejeita uma solicitação de matrícula' })
  @ApiResponse({ status: 204, description: 'Matrícula rejeitada com sucesso.' })
  async reject(@Request() req: any, @Param('enrollmentId') enrollmentId: string, @Body() body: RejectEnrollmentDto) {
    await this._rejectEnrollment.execute({
      loggedInUserId: req.user.id,
      enrollmentRequestId: enrollmentId,
      reason: body.reason,
    });
  }

  @Get('/my-club/members')
  @ApiOperation({ summary: 'Lista todos os membros ativos do meu clube' })
  @ApiResponse({ status: 200, description: 'Lista de membros ativos.', type: [ClubMemberDto] }) // Nota: Deveria ser um DTO de Membro, mas usando o de request por ora.
  async listMembersOfMyClub(@Request() req: any) {
    return this._listMembersOfMyClub.execute({ loggedInUserId: req.user.id });
  }

  @Post('/membership/:membershipId/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoga a afiliação de um membro do clube' })
  @ApiResponse({ status: 204, description: 'Afiliação do membro revogada com sucesso.' })
  async removeMember(@Request() req: any, @Param('membershipId') membershipId: string) {
    await this._removeClubMember.execute({ loggedInUserId: req.user.id, membershipId: membershipId });
  }
}
