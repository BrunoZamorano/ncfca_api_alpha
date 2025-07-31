import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import TrainingRepository, { TRAINING_REPOSITORY } from '@/domain/repositories/training.repository';
import { Training } from '@/domain/entities/training/training.entity';

import { UpdateTrainingDto } from '@/application/use-cases/training/training.dto';

@Injectable()
export class UpdateTraining {
  constructor(@Inject(TRAINING_REPOSITORY) private readonly trainingRepository: TrainingRepository) {}

  async execute(id: string, dto: UpdateTrainingDto): Promise<Training> {
    const existingTraining = await this.trainingRepository.findById(id);
    if (!existingTraining) throw new NotFoundException('Training not found');
    const updatedTraining = existingTraining.update(dto.title, dto.description, dto.youtubeUrl);
    return this.trainingRepository.save(updatedTraining);
  }
}
