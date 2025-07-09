import { AddDependantDto } from '@/infraestructure/dtos/add-dependant.dto';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
  Param,
  Delete,
  Patch,
  Get,
} from '@nestjs/common';
import AddDependant from '@/application/use-cases/add-dependant/add-dependant';
import AuthGuard from '@/shared/guards/auth.guard';
import DependantDto from '@/domain/dtos/dependant.dto';
import DependantMapper from '@/shared/mappers/dependant.mapper';
import ListDependants from '@/application/use-cases/list-dependants/list-dependants';
import UpdateDependant from '@/application/use-cases/update-dependant/update-dependant';
import DeleteDependant from '@/application/use-cases/delete-dependant/delete-dependant';
import { UpdateDependantDto } from '@/infraestructure/dtos/update-dependant.dto';

@Controller('dependants')
@UseGuards(AuthGuard)
export default class DependantController {
  constructor(
    private readonly _addDependant: AddDependant,
    private readonly _listDependants: ListDependants,
    private readonly _updateDependant: UpdateDependant,
    private readonly _deleteDependant: DeleteDependant,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async add(@Request() req: any, @Body() body: AddDependantDto): Promise<DependantDto> {
    const loggedInUserId = req.user.id;
    const dependant = await this._addDependant.execute({ ...body, loggedInUserId });
    return DependantMapper.entityToDto(dependant);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(@Request() req: any) {
    const loggedInUserId = req.user.id;
    return this._listDependants.execute(loggedInUserId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(@Request() req: any, @Param('id') dependantId: string, @Body() body: UpdateDependantDto): Promise<void> {
    const loggedInUserId = req.user.id;
    await this._updateDependant.execute({ ...body, loggedInUserId, dependantId });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Request() req: any, @Param('id') dependantId: string): Promise<void> {
    const loggedInUserId = req.user.id;
    await this._deleteDependant.execute(loggedInUserId, dependantId);
  }
}
