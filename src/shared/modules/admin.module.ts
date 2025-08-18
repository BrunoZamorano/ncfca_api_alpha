import { Module } from '@nestjs/common';

import AdminListUsers from '@/application/use-cases/admin/list-users/list-users';
import AdminListClubs from '@/application/use-cases/admin/list-clubs/list-clubs';
import AdminManageUserRole from '@/application/use-cases/admin/manage-user-role/manage-user-role';
import AdminViewUserFamily from '@/application/use-cases/admin/view-user-family/view-user-family';
import AdminListAffiliations from '@/application/use-cases/admin/list-affiliations/list-affiliations';
import AdminChangeClubPrincipal from '@/application/use-cases/admin/change-club-director/change-club-principal';
import AdminListAllEnrollments from '@/application/use-cases/admin/list-all-enrollments/list-all-enrollments';
import AdminGetUser from '@/application/use-cases/admin/get-user/get-user';
import UpdateClubByAdmin from '@/application/use-cases/admin/update-club-by-admin/update-club-by-admin.use-case';
import AdminListClubMembersUseCase from '@/application/use-cases/admin/list-club-members/list-club-members.use-case';
import AdminListPendingEnrollmentsUseCase from '@/application/use-cases/admin/list-pending-enrollments/list-pending-enrollments.use-case';
import AdminGetClubChartsUseCase from '@/application/use-cases/admin/get-club-charts/get-club-charts.use-case';
import AdminApproveEnrollmentUseCase from '@/application/use-cases/admin/approve-enrollment/approve-enrollment.use-case';
import AdminRejectEnrollmentUseCase from '@/application/use-cases/admin/reject-enrollment/reject-enrollment.use-case';

import AdminController from '@/infraestructure/controllers/admin.controller';
import { GetClubChartsQueryPrisma } from '@/infraestructure/queries/get-club-charts.query.prisma';

import SharedModule from './shared.module';
import ListDependants from '@/application/use-cases/admin/list-dependants/list-dependants';
import { SearchUsers } from '@/application/use-cases/admin/search-users/search-users';
import { USER_QUERY } from '@/application/queries/user-query/user-query.interface';
import { UserQueryPrisma } from '@/infraestructure/queries/user.query.prisma';

@Module({
  imports: [SharedModule],
  controllers: [AdminController],
  providers: [
    AdminListUsers,
    AdminListClubs,
    ListDependants,
    AdminManageUserRole,
    AdminViewUserFamily,
    AdminListAffiliations,
    AdminChangeClubPrincipal,
    AdminListAllEnrollments,
    SearchUsers,
    AdminGetUser,
    UpdateClubByAdmin,
    AdminListClubMembersUseCase,
    AdminListPendingEnrollmentsUseCase,
    AdminGetClubChartsUseCase,
    AdminApproveEnrollmentUseCase,
    AdminRejectEnrollmentUseCase,
    GetClubChartsQueryPrisma,
    {
      provide: USER_QUERY,
      useClass: UserQueryPrisma,
    },
  ],
})
export default class AdminModule {}
