import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { UserRoles } from '@/domain/enums/user-roles';

import { TrainingListItemView } from '@/application/queries/training-query/training-list-item.view';
import { CreateTraining } from '@/application/use-cases/training/create-training/create-training.use-case';
import { UpdateTraining } from '@/application/use-cases/training/update-training/update-training.use.case';
import { DeleteTraining } from '@/application/use-cases/training/delete-training/delete-training.use-case';
import { ListTrainings } from '@/application/use-cases/training/list-training/list-trainings.use-case';
import { CreateTrainingDto, TrainingResponseDto, UpdateTrainingDto } from '@/application/use-cases/training/training.dto';

import AuthGuard from '@/shared/guards/auth.guard';
import { Roles } from '@/shared/decorators/role.decorator';
import { RolesGuard } from '@/shared/guards/roles.guard';

@ApiTags('Trainings')
@Controller('trainings')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class TrainingController {
  constructor(
    private readonly _listTrainings: ListTrainings,
    private readonly _createTraining: CreateTraining,
    private readonly _updateTraining: UpdateTraining,
    private readonly _deleteTraining: DeleteTraining,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os treinamentos' })
  @ApiResponse({ status: 200, description: 'Lista de treinamentos', type: [TrainingListItemView] })
  @Roles(UserRoles.ADMIN, UserRoles.DONO_DE_CLUBE)
  @UseGuards(RolesGuard)
  async listTrainings(): Promise<TrainingListItemView[]> {
    return this._listTrainings.execute();
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo treinamento' })
  @ApiResponse({ status: 201, description: 'Treinamento criado com sucesso', type: TrainingResponseDto })
  @Roles(UserRoles.ADMIN)
  @UseGuards(RolesGuard)
  async createTraining(@Body() createTrainingDto: CreateTrainingDto, @Request() req): Promise<TrainingResponseDto> {
    const training = await this._createTraining.execute(createTrainingDto);
    return {
      id: training.id,
      title: training.title,
      description: training.description,
      youtubeUrl: training.youtubeUrl,
      createdAt: training.createdAt,
      updatedAt: training.updatedAt,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar treinamento' })
  @ApiResponse({ status: 200, description: 'Treinamento atualizado com sucesso', type: TrainingResponseDto })
  @Roles(UserRoles.ADMIN)
  @UseGuards(RolesGuard)
  async updateTraining(@Param('id') id: string, @Body() updateTrainingDto: UpdateTrainingDto): Promise<TrainingResponseDto> {
    const training = await this._updateTraining.execute(id, updateTrainingDto);
    return {
      id: training.id,
      title: training.title,
      description: training.description,
      youtubeUrl: training.youtubeUrl,
      createdAt: training.createdAt,
      updatedAt: training.updatedAt,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar treinamento' })
  @ApiResponse({ status: 204, description: 'Treinamento deletado com sucesso' })
  @Roles(UserRoles.ADMIN)
  @UseGuards(RolesGuard)
  async deleteTraining(@Param('id') id: string): Promise<void> {
    await this._deleteTraining.execute(id);
  }
}
