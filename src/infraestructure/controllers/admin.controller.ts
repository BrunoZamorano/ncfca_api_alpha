import { Controller, Get, UseGuards, HttpCode, HttpStatus, Patch, Param, Body, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import AuthGuard from '@/shared/guards/auth.guard';
import { AdminGuard } from '@/shared/guards/admin.guard';
import AdminListUsers from '@/application/use-cases/admin/list-users/list-users';
import AdminListClubs from '@/application/use-cases/admin/list-clubs/list-clubs';
import AdminManageUserRole from '@/application/use-cases/admin/manage-user-role/manage-user-role';
import { ManageUserRoleDto } from '@/infraestructure/dtos/manage-user-role.dto';
import AdminViewUserFamily from '@/application/use-cases/admin/view-user-family/view-user-family';
import AdminListAffiliations from '@/application/use-cases/admin/list-affiliations/list-affiliations';
import AdminChangeClubPrincipal from '@/application/use-cases/admin/change-club-director/change-club-principal';
import { ChangePrincipalDto } from '@/infraestructure/dtos/change-principal.dto';
import AdminListAllEnrollments from '@/application/use-cases/admin/list-all-enrollments/list-all-enrollments';
import AdminGetUser from '@/application/use-cases/admin/get-user/get-user';
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
import { SearchUsers } from '@/application/use-cases/search-users/search-users';
import SearchUsersQueryDto from '@/domain/dtos/search-users-query.dto';
import { PaginatedUserDto } from '@/domain/dtos/paginated-output.dto';
import UpdateClubByAdmin from '@/application/use-cases/admin/update-club-by-admin/update-club-by-admin.use-case';
import { UpdateClubByAdminDto } from '@/infraestructure/dtos/admin/update-club-by-admin.dto';

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
    private readonly _changeClubPrincipal: AdminChangeClubPrincipal,
    private readonly _listAllEnrollments: AdminListAllEnrollments,
    private readonly _searchUsers: SearchUsers,
    private readonly _getUser: AdminGetUser,
    private readonly _updateClubByAdmin: UpdateClubByAdmin,
  ) {}

  @Get('/users')
  @ApiOperation({ summary: 'Busca usuários do sistema com paginação e filtros' })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso.', type: PaginatedUserDto })
  async searchUsers(@Query() query: SearchUsersQueryDto): Promise<PaginatedUserDto> {
    return this._searchUsers.execute(query);
  }

  @Get('/users/:userId')
  @ApiOperation({ summary: 'Obtém os detalhes de um usuário específico por ID' })
  @ApiResponse({ status: 200, description: 'Dados do usuário retornados com sucesso.', type: UserDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async getUserById(@Param('userId') userId: string): Promise<UserDto> {
    const user = await this._getUser.execute(userId);
    return UserMapper.entityToDto(user);
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

  @Post('/clubs/:clubId/director')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Altera o diretor (proprietário) de um clube' })
  @ApiResponse({ status: 204, description: 'Diretor do clube alterado com sucesso.' })
  async changeClubPrincipal(@Param('clubId') clubId: string, @Body() body: ChangePrincipalDto) {
    await this._changeClubPrincipal.execute({ clubId, newPrincipalId: body.newPrincipalId });
  }

  @Get('/enrollments')
  @ApiOperation({ summary: 'Lista todas as solicitações de matrícula do sistema' })
  @ApiResponse({ status: 200, description: 'Lista de matrículas retornada com sucesso.', type: [EnrollmentRequestDto] })
  async listAllEnrollments() {
    return this._listAllEnrollments.execute();
  }

  @Post('/clubs/:clubId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza os dados de um clube específico' })
  @ApiResponse({ status: 200, description: 'Dados do clube atualizados com sucesso.' })
  @ApiResponse({ status: 404, description: 'Clube não encontrado.' })
  async updateClub(@Param('clubId') clubId: string, @Body() data: UpdateClubByAdminDto): Promise<ClubDto> {
    const club = await this._updateClubByAdmin.execute({ clubId, data });
    return ClubMapper.entityToDto(club);
  }
}
