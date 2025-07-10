import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import AuthGuard from '@/shared/guards/auth.guard';
import ListPendingEnrollments from '@/application/use-cases/list-pending-enrollments/list-pending-enrollments';
import ApproveEnrollment from '@/application/use-cases/approve-enrollment/approve-enrollment';
import RejectEnrollment from '@/application/use-cases/reject-enrollment/reject-enrollment';
import ListClubMembers from '@/application/use-cases/list-club-members/list-club-members';
import RemoveClubMember from '@/application/use-cases/remove-club-member/remove-club-member';
import { RejectEnrollmentDto } from '@/infraestructure/dtos/reject-enrollment.dto';

@Controller('club-management')
@UseGuards(AuthGuard)
export default class ClubManagementController {
  constructor(
    private readonly _listPendingEnrollments: ListPendingEnrollments,
    private readonly _approveEnrollment: ApproveEnrollment,
    private readonly _rejectEnrollment: RejectEnrollment,
    private readonly _listClubMembers: ListClubMembers,
    private readonly _removeClubMember: RemoveClubMember,
  ) {}

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
  async reject(
    @Request() req: any,
    @Param('enrollmentId') enrollmentId: string,
    @Body() body: RejectEnrollmentDto,
  ) {
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

  @Delete('/enrollments/:enrollmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(@Request() req: any, @Param('enrollmentId') enrollmentId: string) {
    await this._removeClubMember.execute({ loggedInUserId: req.user.id, enrollmentRequestId: enrollmentId });
  }
}