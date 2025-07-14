import { Module } from '@nestjs/common';
import SharedModule from './shared.module';
import ListPendingEnrollments from '@/application/use-cases/list-pending-enrollments/list-pending-enrollments';
import ApproveEnrollment from '@/application/use-cases/approve-enrollment/approve-enrollment';
import RejectEnrollment from '@/application/use-cases/reject-enrollment/reject-enrollment';
import ListClubMembers from '@/application/use-cases/list-club-members/list-club-members';
import RemoveClubMember from '@/application/use-cases/remove-club-member/remove-club-member';
import ClubManagementController from '@/infraestructure/controllers/club-management/club-management.controller';
import UpdateClubInfo from '@/application/use-cases/update-club-info/update-club-info';
import GetMyClubInfo from '@/application/use-cases/get-my-club-info/get-my-club-info';

@Module({
  imports: [SharedModule],
  controllers: [ClubManagementController],
  providers: [
    ListPendingEnrollments,
    ApproveEnrollment,
    RejectEnrollment,
    ListClubMembers,
    RemoveClubMember,
    UpdateClubInfo,
    GetMyClubInfo,
  ],
})
export default class ClubManagementModule {}