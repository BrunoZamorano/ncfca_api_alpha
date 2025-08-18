import { Module } from '@nestjs/common';
import SharedModule from './shared.module';
import ListPendingEnrollments from '@/application/use-cases/club-management/list-pending-enrollments/list-pending-enrollments';
import ApproveEnrollment from '@/application/use-cases/club-management/approve-enrollment/approve-enrollment';
import RejectEnrollment from '@/application/use-cases/club-management/reject-enrollment/reject-enrollment';
import RemoveClubMember from '@/application/use-cases/club/remove-club-member/remove-club-member';
import ClubManagementController from '@/infraestructure/controllers/club-management/club-management.controller';
import UpdateClubInfo from '@/application/use-cases/club/update-club-info/update-club-info';
import GetMyClubInfo from '@/application/use-cases/club/get-my-club-info/get-my-club-info';
import ListMembersOfMyClub from '@/application/use-cases/club/list-members-of-my-club/list-members-of-my-club';
import ListAllEnrollments from '@/application/use-cases/club-management/list-all-enrollments/list-all-enrollments';

@Module({
  imports: [SharedModule],
  controllers: [ClubManagementController],
  providers: [
    ListPendingEnrollments,
    ListMembersOfMyClub,
    ListAllEnrollments,
    ApproveEnrollment,
    RemoveClubMember,
    RejectEnrollment,
    UpdateClubInfo,
    GetMyClubInfo,
  ],
})
export default class ClubManagementModule {}
