import { Training } from '@/domain/entities/training/training.entity';

export default interface TrainingRepository {
  findAll(): Promise<Training[]>;
  findById(id: string): Promise<Training | null>;
  save(training: Training): Promise<Training>;
  delete(id: string): Promise<void>;
}

export const TRAINING_REPOSITORY = Symbol('TRAINING_REPOSITORY');
