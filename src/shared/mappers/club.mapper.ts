import Entity from '@/domain/entities/club/club';
import Dto from '@/domain/dtos/club.dto';
import { Club as Model } from '@prisma/client';

export default class ClubMapper {
  static toEntity(data: Model): Entity {
    return new Entity({
      id: data.id,
      name: data.name,
      city: data.city,
      ownerId: data.owner_id,
    });
  }

  static toModel(entity: Entity): Omit<Model, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      name: entity.name,
      city: entity.city,
      state: 'RR',
      status: true,
      owner_id: entity.ownerId,
    };
  }

  static entityToDto(entity: Entity): Dto {
    return {
      affiliatedFamilies: entity.affiliatedFamilies,
      ownerId: entity.ownerId,
      name: entity.name,
      city: entity.city,
      id: entity.id,
    };
  }
}
