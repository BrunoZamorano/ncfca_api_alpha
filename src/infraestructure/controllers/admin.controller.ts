import { Controller, Get, UseGuards, HttpCode, HttpStatus, Patch, Param, Body, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
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
import AdminListClubMembersUseCase, { ClubMemberView } from '@/application/use-cases/admin/list-club-members/list-club-members.use-case';
import AdminListPendingEnrollmentsUseCase, { PendingEnrollmentView } from '@/application/use-cases/admin/list-pending-enrollments/list-pending-enrollments.use-case';
import AdminGetClubChartsUseCase from '@/application/use-cases/admin/get-club-charts/get-club-charts.use-case';
import AdminApproveEnrollmentUseCase from '@/application/use-cases/admin/approve-enrollment/approve-enrollment.use-case';
import AdminRejectEnrollmentUseCase from '@/application/use-cases/admin/reject-enrollment/reject-enrollment.use-case';
import { ListClubMembersQuery } from '@/application/use-cases/admin/list-club-members/list-club-members.query';
import { ListPendingEnrollmentsQuery } from '@/application/use-cases/admin/list-pending-enrollments/list-pending-enrollments.query';
import { GetClubChartsQuery } from '@/application/use-cases/admin/get-club-charts/get-club-charts.query';
import { AdminApproveEnrollmentCommand } from '@/application/use-cases/admin/approve-enrollment/approve-enrollment.command';
import { AdminRejectEnrollmentCommand } from '@/application/use-cases/admin/reject-enrollment/reject-enrollment.command';
import { ClubChartsData } from '@/infraestructure/queries/get-club-charts.query.prisma';

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
    private readonly _listClubMembers: AdminListClubMembersUseCase,
    private readonly _listPendingEnrollments: AdminListPendingEnrollmentsUseCase,
    private readonly _getClubCharts: AdminGetClubChartsUseCase,
    private readonly _approveEnrollment: AdminApproveEnrollmentUseCase,
    private readonly _rejectEnrollment: AdminRejectEnrollmentUseCase,
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

  @Patch('/clubs/:clubId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Atualiza os dados de um clube específico' })
  @ApiResponse({ status: 204, description: 'Dados do clube atualizados com sucesso.' })
  @ApiResponse({ status: 404, description: 'Clube não encontrado.' })
  async updateClub(@Param('clubId') clubId: string, @Body() data: UpdateClubByAdminDto): Promise<void> {
    await this._updateClubByAdmin.execute({ clubId, data });
  }

  @Get('/clubs/:clubId/members')
  @ApiOperation({ 
    summary: 'Lista todos os membros de um clube específico',
    description: 'Retorna uma lista paginada de todos os membros ativos de um clube, incluindo informações do dependente como nome, idade, tipo e dados de contato.'
  })
  @ApiParam({ 
    name: 'clubId', 
    description: 'ID único do clube',
    example: 'b5e4e8a1-8f1b-4c9d-9e3f-1a2b3c4d5e6f'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Número da página para paginação',
    example: 1,
    type: Number
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Quantidade de itens por página',
    example: 10,
    type: Number
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de membros retornada com sucesso.',
    schema: {
      type: 'object',
      properties: {
        members: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'b5e4e8a1-8f1b-4c9d-9e3f-1a2b3c4d5e6f' },
              dependantId: { type: 'string', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
              dependantName: { type: 'string', example: 'João Silva' },
              dependantAge: { type: 'number', example: 15 },
              dependantType: { type: 'string', example: 'STUDENT' },
              dependantSex: { type: 'string', example: 'MALE' },
              dependantEmail: { type: 'string', example: 'joao@email.com', nullable: true },
              dependantPhone: { type: 'string', example: '(11) 99999-9999', nullable: true },
              joinedAt: { type: 'string', format: 'date-time' },
              status: { type: 'string', example: 'ACTIVE' }
            }
          }
        },
        total: { type: 'number', example: 25 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token de autenticação não fornecido ou inválido.' })
  @ApiResponse({ status: 403, description: 'Usuário não possui permissão de administrador.' })
  @ApiResponse({ status: 404, description: 'Clube não encontrado.' })
  async getClubMembers(
    @Param('clubId') clubId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{
    members: ClubMemberView[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = new ListClubMembersQuery(clubId, page, limit);
    return await this._listClubMembers.execute(query);
  }

  @Get('/clubs/:clubId/enrollments/pending')
  @ApiOperation({ 
    summary: 'Lista todas as solicitações de matrícula pendentes de um clube',
    description: 'Retorna todas as solicitações de matrícula com status PENDING para um clube específico, incluindo informações do dependente solicitante.'
  })
  @ApiParam({ 
    name: 'clubId', 
    description: 'ID único do clube',
    example: 'b5e4e8a1-8f1b-4c9d-9e3f-1a2b3c4d5e6f'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de solicitações pendentes retornada com sucesso.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'b5e4e8a1-8f1b-4c9d-9e3f-1a2b3c4d5e6f' },
          dependantId: { type: 'string', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
          dependantName: { type: 'string', example: 'Maria Santos' },
          dependantAge: { type: 'number', example: 16 },
          dependantType: { type: 'string', example: 'STUDENT' },
          dependantSex: { type: 'string', example: 'FEMALE' },
          dependantEmail: { type: 'string', example: 'maria@email.com', nullable: true },
          dependantPhone: { type: 'string', example: '(11) 88888-8888', nullable: true },
          requestedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', example: 'PENDING' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token de autenticação não fornecido ou inválido.' })
  @ApiResponse({ status: 403, description: 'Usuário não possui permissão de administrador.' })
  @ApiResponse({ status: 404, description: 'Clube não encontrado.' })
  async getPendingEnrollments(@Param('clubId') clubId: string): Promise<PendingEnrollmentView[]> {
    const query = new ListPendingEnrollmentsQuery(clubId);
    return await this._listPendingEnrollments.execute(query);
  }

  @Get('/clubs/:clubId/charts')
  @ApiOperation({ 
    summary: 'Obtém dados de gráficos para o dashboard do clube',
    description: 'Retorna dados agregados para exibição em gráficos no dashboard administrativo, incluindo distribuição de membros por tipo/sexo e histórico de matrículas.'
  })
  @ApiParam({ 
    name: 'clubId', 
    description: 'ID único do clube',
    example: 'b5e4e8a1-8f1b-4c9d-9e3f-1a2b3c4d5e6f'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dados de gráficos retornados com sucesso.',
    schema: {
      type: 'object',
      properties: {
        memberCountByType: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'STUDENT' },
              count: { type: 'number', example: 15 }
            }
          }
        },
        memberCountBySex: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sex: { type: 'string', example: 'MALE' },
              count: { type: 'number', example: 12 }
            }
          }
        },
        enrollmentsOverTime: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'string', example: '2024-01' },
              count: { type: 'number', example: 5 }
            }
          }
        },
        totalActiveMembers: { type: 'number', example: 25 },
        totalPendingEnrollments: { type: 'number', example: 3 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token de autenticação não fornecido ou inválido.' })
  @ApiResponse({ status: 403, description: 'Usuário não possui permissão de administrador.' })
  @ApiResponse({ status: 404, description: 'Clube não encontrado.' })
  async getClubCharts(@Param('clubId') clubId: string): Promise<ClubChartsData> {
    const query = new GetClubChartsQuery(clubId);
    return await this._getClubCharts.execute(query);
  }

  @Post('/clubs/:clubId/enrollments/:enrollmentId/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Aprova uma solicitação de matrícula',
    description: 'Permite que um administrador aprove uma solicitação de matrícula pendente, adicionando o dependente como membro ativo do clube. Não requer autorização do proprietário do clube.'
  })
  @ApiParam({ 
    name: 'clubId', 
    description: 'ID único do clube',
    example: 'b5e4e8a1-8f1b-4c9d-9e3f-1a2b3c4d5e6f'
  })
  @ApiParam({ 
    name: 'enrollmentId', 
    description: 'ID único da solicitação de matrícula',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
  })
  @ApiResponse({ status: 204, description: 'Solicitação aprovada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Solicitação não está pendente ou família não está afiliada.' })
  @ApiResponse({ status: 401, description: 'Token de autenticação não fornecido ou inválido.' })
  @ApiResponse({ status: 403, description: 'Usuário não possui permissão de administrador.' })
  @ApiResponse({ status: 404, description: 'Clube ou solicitação de matrícula não encontrada.' })
  @ApiResponse({ status: 422, description: 'Clube atingiu o número máximo de membros.' })
  async approveEnrollment(
    @Param('clubId') clubId: string,
    @Param('enrollmentId') enrollmentId: string,
  ): Promise<void> {
    const command = new AdminApproveEnrollmentCommand(clubId, enrollmentId);
    await this._approveEnrollment.execute(command);
  }

  @Post('/clubs/:clubId/enrollments/:enrollmentId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Rejeita uma solicitação de matrícula',
    description: 'Permite que um administrador rejeite uma solicitação de matrícula pendente, com motivo opcional.'
  })
  @ApiParam({ 
    name: 'clubId', 
    description: 'ID único do clube',
    example: 'b5e4e8a1-8f1b-4c9d-9e3f-1a2b3c4d5e6f'
  })
  @ApiParam({ 
    name: 'enrollmentId', 
    description: 'ID único da solicitação de matrícula',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
  })
  @ApiBody({
    description: 'Dados opcionais para rejeição',
    required: false,
    schema: {
      type: 'object',
      properties: {
        rejectionReason: { 
          type: 'string', 
          example: 'Documentação incompleta',
          description: 'Motivo da rejeição (opcional). Se não fornecido, será usado o motivo padrão.' 
        }
      }
    }
  })
  @ApiResponse({ status: 204, description: 'Solicitação rejeitada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Solicitação não está pendente ou não pertence ao clube especificado.' })
  @ApiResponse({ status: 401, description: 'Token de autenticação não fornecido ou inválido.' })
  @ApiResponse({ status: 403, description: 'Usuário não possui permissão de administrador.' })
  @ApiResponse({ status: 404, description: 'Clube ou solicitação de matrícula não encontrada.' })
  async rejectEnrollment(
    @Param('clubId') clubId: string,
    @Param('enrollmentId') enrollmentId: string,
    @Body('rejectionReason') rejectionReason?: string,
  ): Promise<void> {
    const command = new AdminRejectEnrollmentCommand(clubId, enrollmentId, rejectionReason);
    await this._rejectEnrollment.execute(command);
  }
}
