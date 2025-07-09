import Entity from '@/domain/entities/dependant/dependant';
import Dto from '@/domain/dtos/dependant.dto';

export default class DependantMapper {
  static entityToDto(entity: Entity): Dto {
    return {
      relationship: entity.relationship,
      birthdate: entity.birthdate,
      firstName: entity.firstName,
      lastName: entity.lastName,
      phone: entity.phone,
      email: entity.email,
      sex: entity.sex,
      id: entity.id,
    };
  }
}
