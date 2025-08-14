import { AddDependantDto } from '@/infraestructure/dtos/add-dependant.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import AddDependant from '@/application/use-cases/add-dependant/add-dependant';
import AuthGuard from '@/shared/guards/auth.guard';
import DependantDto from '@/domain/dtos/dependant.dto';
import DependantMapper from '@/shared/mappers/dependant.mapper';
import ListUserDependants from '@/application/use-cases/list-user-dependants/list-user-dependants';
import UpdateDependant from '@/application/use-cases/update-dependant/update-dependant';
import DeleteDependant from '@/application/use-cases/delete-dependant/delete-dependant';
import { UpdateDependantDto } from '@/infraestructure/dtos/update-dependant.dto';
import ViewMyFamily from '@/application/use-cases/view-my-family/view-my-family';
import FamilyMapper from '@/shared/mappers/family.mapper';
import { FamilyDto } from '@/domain/dtos/family.dto';
import ViewDependant from '@/application/use-cases/view-dependant/view-dependant';
import { ViewDependantOutputDto } from '@/infraestructure/dtos/view-dependant.dto';

@ApiTags('Família e Dependentes')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('dependants')
export default class DependantController {
  constructor(
    private readonly _deleteDependant: DeleteDependant,
    private readonly _updateDependant: UpdateDependant,
    private readonly _listDependants: ListUserDependants,
    private readonly _viewDependant: ViewDependant,
    private readonly _viewMyFamily: ViewMyFamily,
    private readonly _addDependant: AddDependant,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Adiciona um novo dependente à família do usuário' })
  @ApiResponse({ status: 201, description: 'Dependente adicionado com sucesso.', type: DependantDto })
  @HttpCode(HttpStatus.CREATED)
  async add(@Request() req: any, @Body() body: AddDependantDto): Promise<DependantDto> {
    const loggedInUserId = req.user.id;
    const dependant = await this._addDependant.execute({ ...body, loggedInUserId });
    return DependantMapper.entityToDto(dependant);
  }

  @Get('/my-family')
  @ApiOperation({ summary: 'Visualiza os dados da família do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Dados da família retornados com sucesso.', type: FamilyDto })
  @HttpCode(HttpStatus.OK)
  async viewMyFamily(@Request() req: any): Promise<FamilyDto> {
    const family = await this._viewMyFamily.execute({ loggedInUserId: req.user.id });
    return FamilyMapper.entityToDto(family);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Visualiza os dados de um dependente.' })
  @ApiResponse({ status: 200, description: 'Dados de um dependente.', type: ViewDependantOutputDto })
  @HttpCode(HttpStatus.OK)
  async viewDependant(@Param('id') dependantId: string): Promise<ViewDependantOutputDto> {
    const output = await this._viewDependant.execute(dependantId);
    return { ...DependantMapper.entityToDto(output.dependant), holder: output.holder };
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os dependentes da família do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de dependentes retornada com sucesso.', type: [DependantDto] })
  @HttpCode(HttpStatus.OK)
  async list(@Request() req: any): Promise<DependantDto[]> {
    const loggedInUserId = req.user.id;
    const dependants = await this._listDependants.execute(loggedInUserId);
    return dependants.map((dependant) => DependantMapper.entityToDto(dependant));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de um dependente específico' })
  @ApiResponse({ status: 204, description: 'Dependente atualizado com sucesso.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(@Request() req: any, @Param('id') dependantId: string, @Body() body: UpdateDependantDto): Promise<void> {
    const loggedInUserId = req.user.id;
    await this._updateDependant.execute({ ...body, loggedInUserId, dependantId });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um dependente da família' })
  @ApiResponse({ status: 204, description: 'Dependente removido com sucesso.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Request() req: any, @Param('id') dependantId: string): Promise<void> {
    const loggedInUserId = req.user.id;
    await this._deleteDependant.execute(loggedInUserId, dependantId);
  }
}
