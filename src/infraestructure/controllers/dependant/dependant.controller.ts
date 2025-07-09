import { AddDependantDto } from '@/infraestructure/dtos/add-dependant.dto';
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Request } from '@nestjs/common';
import AddDependant from '@/application/use-cases/add-dependant/add-dependant';
import AuthGuard from '@/shared/guards/auth.guard';
import DependantDto from '@/domain/dtos/dependant.dto';
import DependantMapper from '@/shared/mappers/dependant.mapper';

@Controller('dependants')
@UseGuards(AuthGuard)
export default class DependantController {
  constructor(private readonly _addDependant: AddDependant) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async add(@Request() req: any, @Body() body: AddDependantDto): Promise<DependantDto> {
    const loggedInUserId = req.user.id;
    const dependant = await this._addDependant.execute({ ...body, loggedInUserId });
    return DependantMapper.entityToDto(dependant)
  }
}
