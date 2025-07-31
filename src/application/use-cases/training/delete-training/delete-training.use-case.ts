import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import TrainingRepository, { TRAINING_REPOSITORY } from '@/domain/repositories/training.repository';

@Injectable()
export class DeleteTraining {
  constructor(
    @Inject(TRAINING_REPOSITORY)
    private readonly trainingRepository: TrainingRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const training = await this.trainingRepository.findById(id);
    if (!training) throw new NotFoundException('Training not found');
    await this.trainingRepository.delete(id);
  }
}
