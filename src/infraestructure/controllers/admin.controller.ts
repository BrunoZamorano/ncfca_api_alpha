import { Controller, Get, UseGuards, HttpCode, HttpStatus, Patch, Param, Body, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
import { UserDto } from '@/domain/dtos/user.dto';
import ClubDto from '@/domain/dtos/club.dto';
import { FamilyDto } from '@/domain/dtos/family.dto';
import { EnrollmentRequestDto } from '@/domain/dtos/enrollment-request.dto';
import UserMapper from '@/shared/mappers/user.mapper';
import ClubMapper from '@/shared/mappers/club.mapper';
import FamilyMapper from '@/shared/mappers/family.mapper';
import { AffiliationDto } from '@/domain/dtos/affiliation.dto';
import ListDependants from '@/application/use-cases/list-dependants/list-dependants';
import { DependantsListItemView } from '@/application/queries/dependant-query/dependants-list-item.view';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export default class AdminController {
  constructor(
    private readonly _listUsers: AdminListUsers,
    private readonly _listClubs: AdminListClubs,
    private readonly _listDependants: ListDependants,
    private readonly _manageUserRole: AdminManageUserRole,
    private readonly _viewUserFamily: AdminViewUserFamily,
    private readonly _listAffiliations: AdminListAffiliations,
    private readonly _changeClubDirector: AdminChangeClubDirector,
    private readonly _listAllEnrollments: AdminListAllEnrollments,
  ) {}

  @Get('/users')
  @ApiOperation({ summary: 'Lista todos os usuários do sistema' })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso.', type: [UserDto] })
  async listUsers() {
    const users = await this._listUsers.execute();
    return users.map(UserMapper.entityToDto);
  }

  @Get('/clubs')
  @ApiOperation({ summary: 'Lista todos os clubes do sistema' })
  @ApiResponse({ status: 200, description: 'Lista de clubes retornada com sucesso.', type: [ClubDto] })
  async listClubs() {
    const clubs = await this._listClubs.execute();
    return clubs.map(ClubMapper.entityToDto);
  }

  @Get('/dependants')
  @ApiOperation({ summary: 'Lista todos os dependentes do sistema' })
  @ApiResponse({
    status: 200,
    description: 'Lista de dependentes retornada com sucesso.',
    type: [DependantsListItemView],
  })
  async listDependants(): Promise<DependantsListItemView[]> {
    return await this._listDependants.execute();
  }

  @Post('/users/:userId/roles')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Gerencia os perfis (roles) de um usuário' })
  @ApiResponse({ status: 204, description: 'Perfis do usuário atualizados com sucesso.' })
  async manageUserRole(@Param('userId') userId: string, @Body() body: ManageUserRoleDto) {
    await this._manageUserRole.execute({ userId, roles: body.roles });
  }

  @Get('/users/:userId/family')
  @ApiOperation({ summary: 'Visualiza os detalhes da família de um usuário específico' })
  //todo: corrigir dtos
  @ApiResponse({ status: 200, description: 'Dados da família retornados com sucesso.', type: FamilyDto })
  async viewUserFamily(@Param('userId') userId: string) {
    const output = await this._viewUserFamily.execute(userId);
    return { user: UserMapper.entityToDto(output.user), family: FamilyMapper.entityToDto(output.family) };
  }

  @Get('/affiliations')
  @ApiOperation({ summary: 'Lista todas as afiliações de famílias e seus status' })
  @ApiResponse({ status: 200, description: 'Lista de afiliações retornada com sucesso.', type: [AffiliationDto] })
  async listAffiliations() {
    return await this._listAffiliations.execute();
  }

  @Patch('/clubs/:clubId/director')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Altera o diretor (proprietário) de um clube' })
  @ApiResponse({ status: 204, description: 'Diretor do clube alterado com sucesso.' })
  async changeClubDirector(@Param('clubId') clubId: string, @Body() body: ChangeClubDirectorDto) {
    await this._changeClubDirector.execute({ clubId, newDirectorId: body.newDirectorId });
  }

  @Get('/enrollments')
  @ApiOperation({ summary: 'Lista todas as solicitações de matrícula do sistema' })
  @ApiResponse({ status: 200, description: 'Lista de matrículas retornada com sucesso.', type: [EnrollmentRequestDto] })
  async listAllEnrollments() {
    return this._listAllEnrollments.execute();
  }
}
