import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import AuthGuard from '@/shared/guards/auth.guard';
import ListPendingEnrollments from '@/application/use-cases/list-pending-enrollments/list-pending-enrollments';
import ApproveEnrollment from '@/application/use-cases/approve-enrollment/approve-enrollment';
import RejectEnrollment from '@/application/use-cases/reject-enrollment/reject-enrollment';
import ListClubMembers from '@/application/use-cases/list-club-members/list-club-members';
import RemoveClubMember from '@/application/use-cases/remove-club-member/remove-club-member';
import { RejectEnrollmentDto } from '@/infraestructure/dtos/reject-enrollment.dto';
import UpdateClubInfo from '@/application/use-cases/update-club-info/update-club-info';
import { UpdateClubDto } from '@/infraestructure/dtos/update-club.dto';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { Roles } from '@/shared/decorators/role.decorator';
import { UserRoles } from '@/domain/enums/user-roles';

@Controller('club-management')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRoles.DONO_DE_CLUBE)
export default class ClubManagementController {
  constructor(
    private readonly _listPendingEnrollments: ListPendingEnrollments,
    private readonly _approveEnrollment: ApproveEnrollment,
    private readonly _rejectEnrollment: RejectEnrollment,
    private readonly _listClubMembers: ListClubMembers,
    private readonly _removeClubMember: RemoveClubMember,
    private readonly _updateClubInfo: UpdateClubInfo,
  ) {}

  @Patch(':clubId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateClub(@Request() req: any, @Param('clubId') clubId: string, @Body() body: UpdateClubDto): Promise<void> {
    await this._updateClubInfo.execute({
      loggedInUserId: req.user.id,
      clubId,
      ...body,
    });
  }

  @Get(':clubId/enrollments/pending')
  async listPending(@Request() req: any, @Param('clubId') clubId: string) {
    return this._listPendingEnrollments.execute({ loggedInUserId: req.user.id, clubId });
  }

  @Post('/enrollments/:enrollmentId/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  async approve(@Request() req: any, @Param('enrollmentId') enrollmentId: string) {
    await this._approveEnrollment.execute({ loggedInUserId: req.user.id, enrollmentRequestId: enrollmentId });
  }

  @Post('/enrollments/:enrollmentId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reject(@Request() req: any, @Param('enrollmentId') enrollmentId: string, @Body() body: RejectEnrollmentDto) {
    await this._rejectEnrollment.execute({
      loggedInUserId: req.user.id,
      enrollmentRequestId: enrollmentId,
      reason: body.reason,
    });
  }

  @Get(':clubId/members')
  async listMembers(@Request() req: any, @Param('clubId') clubId: string) {
    return this._listClubMembers.execute({ loggedInUserId: req.user.id, clubId });
  }

  @Post('/enrollments/:enrollmentId/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(@Request() req: any, @Param('enrollmentId') enrollmentId: string) {
    await this._removeClubMember.execute({ loggedInUserId: req.user.id, enrollmentRequestId: enrollmentId });
  }
}
