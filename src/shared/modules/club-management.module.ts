import { Module } from '@nestjs/common';
import SharedModule from './shared.module';
import ListPendingEnrollments from '@/application/use-cases/list-pending-enrollments/list-pending-enrollments';
import ApproveEnrollment from '@/application/use-cases/approve-enrollment/approve-enrollment';
import RejectEnrollment from '@/application/use-cases/reject-enrollment/reject-enrollment';
import RemoveClubMember from '@/application/use-cases/remove-club-member/remove-club-member';
import ClubManagementController from '@/infraestructure/controllers/club-management/club-management.controller';
import UpdateClubInfo from '@/application/use-cases/update-club-info/update-club-info';
import GetMyClubInfo from '@/application/use-cases/get-my-club-info/get-my-club-info';
import ListMembersOfMyClub from '@/application/use-cases/list-members-of-my-club/list-members-of-my-club';

@Module({
  imports: [SharedModule],
  controllers: [ClubManagementController],
  providers: [
    ListPendingEnrollments,
    ListMembersOfMyClub,
    ApproveEnrollment,
    RemoveClubMember,
    RejectEnrollment,
    UpdateClubInfo,
    GetMyClubInfo,
  ],
})
export default class ClubManagementModule {}
