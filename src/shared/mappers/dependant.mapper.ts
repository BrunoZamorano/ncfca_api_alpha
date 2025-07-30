import { Dependant as Model } from '@prisma/client';

import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';
import { Sex } from '@/domain/enums/sex';
import Entity from '@/domain/entities/dependant/dependant';
import Email from '@/domain/value-objects/email/email';
import Dto from '@/domain/dtos/dependant.dto';
import { DependantType } from '@/domain/enums/dependant-type.enum';

export default class DependantMapper {
  static toEntity(model: Model): Entity {
    return new Entity({
      id: model.id,
      sex: model.sex as Sex,
      type: model.type as DependantType,
      email: model.email ? new Email(model.email) : undefined,
      phone: model.phone ?? undefined,
      familyId: model.family_id,
      lastName: model.last_name,
      firstName: model.first_name,
      birthdate: new Birthdate(model.birthdate.toISOString().split('T')[0]),
      relationship: model.relationship as DependantRelationship,
    });
  }

  static toModel(entity: Entity): Omit<Model, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      sex: entity.sex,
      type: entity.type,
      email: entity.email ?? null,
      phone: entity.phone ?? null,
      family_id: entity.familyId,
      birthdate: entity.birthdate,
      last_name: entity.lastName,
      first_name: entity.firstName,
      relationship: entity.relationship,
    };
  }

  static entityToDto(entity: Entity): Dto {
    return {
      relationship: entity.relationship,
      birthdate: entity.birthdate,
      firstName: entity.firstName,
      lastName: entity.lastName,
      phone: entity.phone ?? null,
      familyId: entity.familyId,
      email: entity.email ?? null,
      type: entity.type,
      sex: entity.sex,
      id: entity.id,
    };
  }
}
