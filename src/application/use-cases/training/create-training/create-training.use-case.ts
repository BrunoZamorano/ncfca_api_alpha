import { Inject, Injectable } from '@nestjs/common';

import TrainingRepository, { TRAINING_REPOSITORY } from '@/domain/repositories/training.repository';
import { Training } from '@/domain/entities/training/training.entity';

import { CreateTrainingDto } from '@/application/use-cases/training/training.dto';
import IdGenerator from '@/application/services/id-generator';

import { ID_GENERATOR } from '@/shared/constants/service-constants';

@Injectable()
export class CreateTraining {
  constructor(
    @Inject(TRAINING_REPOSITORY) private readonly trainingRepository: TrainingRepository,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
  ) {}

  async execute(dto: CreateTrainingDto): Promise<Training> {
    const training = Training.create(this.idGenerator.generate(), dto.title, dto.description, dto.youtubeUrl);
    return this.trainingRepository.save(training);
  }
}
