import { Injectable } from '@nestjs/common';

import TrainingRepository from '@/domain/repositories/training.repository';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { Training } from '@/domain/entities/training/training.entity';
import TrainingMapper from '@/shared/mappers/training.mapper';

@Injectable()
export class TrainingRepositoryPrisma implements TrainingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Training[]> {
    const trainings = await this.prisma.training.findMany({
      orderBy: { created_at: 'desc' },
    });
    return trainings.map(TrainingMapper.toDomain);
  }

  async findById(id: string): Promise<Training | null> {
    const training = await this.prisma.training.findUnique({
      where: { id },
    });
    return training ? TrainingMapper.toDomain(training) : null;
  }

  async save(training: Training): Promise<Training> {
    const trainingData = TrainingMapper.toPersistence(training);
    const savedTraining = await this.prisma.training.upsert({
      where: { id: training.id },
      update: trainingData,
      create: trainingData,
    });
    return TrainingMapper.toDomain(savedTraining);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.training.delete({
      where: { id },
    });
  }
}
