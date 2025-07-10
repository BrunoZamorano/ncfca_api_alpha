import { Module } from '@nestjs/common';

import AdminListUsers from '@/application/use-cases/admin/list-users/list-users';
import AdminListClubs from '@/application/use-cases/admin/list-clubs/list-clubs';
import AdminManageUserRole from '@/application/use-cases/admin/manage-user-role/manage-user-role';
import AdminViewUserFamily from '@/application/use-cases/admin/view-user-family/view-user-family';
import AdminListAffiliations from '@/application/use-cases/admin/list-affiliations/list-affiliations';
import AdminChangeClubDirector from '@/application/use-cases/admin/change-club-director/change-club-director';
import AdminListAllEnrollments from '@/application/use-cases/admin/list-all-enrollments/list-all-enrollments';

import AdminController from '@/infraestructure/controllers/admin.controller';

import SharedModule from './shared.module';

@Module({
  imports: [SharedModule],
  controllers: [AdminController],
  providers: [
    AdminListUsers,
    AdminListClubs,
    AdminManageUserRole,
    AdminViewUserFamily,
    AdminListAffiliations,
    AdminChangeClubDirector,
    AdminListAllEnrollments,
  ],
})
export default class AdminModule {}
