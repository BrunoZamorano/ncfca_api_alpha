import { Controller, Get, UseGuards, HttpCode, HttpStatus, Patch, Param, Body, Post } from '@nestjs/common';
import AuthGuard from '@/shared/guards/auth.guard';
import { AdminGuard } from '@/shared/guards/admin.guard';
import AdminListUsers from '@/application/use-cases/admin/list-users/list-users';
import AdminListClubs from '@/application/use-cases/admin/list-clubs/list-clubs';
import AdminManageUserRole from '@/application/use-cases/admin/manage-user-role/manage-user-role';
import { ManageUserRoleDto } from '@/infraestructure/dtos/manage-user-role.dto';
import AdminViewUserFamily from '@/application/use-cases/admin/view-user-family/view-user-family';
import AdminListAffiliations from '@/application/use-cases/admin/list-affiliations/list-affiliations';
import AdminChangeClubDirector from '@/application/use-cases/admin/change-club-director/change-club-director';
import { ChangeClubDirectorDto } from '@/infraestructure/dtos/change-club-director.dto';
import AdminListAllEnrollments from '@/application/use-cases/admin/list-all-enrollments/list-all-enrollments';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export default class AdminController {
  constructor(
    private readonly _listUsers: AdminListUsers,
    private readonly _listClubs: AdminListClubs,
    private readonly _manageUserRole: AdminManageUserRole,
    private readonly _viewUserFamily: AdminViewUserFamily,
    private readonly _listAffiliations: AdminListAffiliations,
    private readonly _changeClubDirector: AdminChangeClubDirector,
    private readonly _listAllEnrollments: AdminListAllEnrollments,
  ) {}
  @Get('users')
  @HttpCode(HttpStatus.OK)
  async listUsers() {
    return this._listUsers.execute();
  }
  @Get('clubs')
  @HttpCode(HttpStatus.OK)
  async listClubs() {
    return this._listClubs.execute();
  }
  @Post('users/:userId/roles')
  @HttpCode(HttpStatus.NO_CONTENT)
  async manageUserRole(@Param('userId') userId: string, @Body() body: ManageUserRoleDto) {
    await this._manageUserRole.execute({ userId, roles: body.roles });
  }
  @Get('users/:userId/family')
  @HttpCode(HttpStatus.OK)
  async viewUserFamily(@Param('userId') userId: string) {
    return this._viewUserFamily.execute(userId);
  }
  @Get('affiliations')
  @HttpCode(HttpStatus.OK)
  async listAffiliations() {
    return this._listAffiliations.execute();
  }
  @Patch('clubs/:clubId/director')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeClubDirector(@Param('clubId') clubId: string, @Body() body: ChangeClubDirectorDto) {
    await this._changeClubDirector.execute({ clubId, newDirectorId: body.newDirectorId });
  }
  @Get('enrollments')
  @HttpCode(HttpStatus.OK)
  async listAllEnrollments() {
    return this._listAllEnrollments.execute();
  }
}
