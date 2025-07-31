import { Training as Model } from '@prisma/client';
import { Training as Entity } from '@/domain/entities/training/training.entity';

export default class TrainingMapper {
  static toDomain(raw: Model): Entity {
    return new Entity(
      raw.id,
      raw.title,
      raw.description,
      raw.youtube_url,
      raw.created_at,
      raw.updated_at,
    );
  }

  static toPersistence(training: Entity) {
    return {
      id: training.id,
      title: training.title,
      description: training.description,
      youtube_url: training.youtubeUrl,
      created_at: training.createdAt,
      updated_at: training.updatedAt,
    };
  }
}
