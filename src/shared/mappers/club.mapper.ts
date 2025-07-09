import Entity from '@/domain/entities/club/club';
import Dto from '@/domain/dtos/club.dto';

export default class ClubMapper {
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
