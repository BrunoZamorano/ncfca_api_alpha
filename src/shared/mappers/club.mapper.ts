import ClubDto from '@/domain/dtos/club.dto';
import Entity from '@/domain/entities/club/club';

export default class ClubMapper {
  static entityToDto(entity: Entity): ClubDto {
    return {
      affiliatedFamilies: entity.affiliatedFamilies,
      ownerId: entity.ownerId,
      name: entity.name,
      city: entity.city,
      id: entity.id,
    };
  }
}
