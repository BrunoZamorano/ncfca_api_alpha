import { Dependant as Model } from '@prisma/client';

import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';
import { Sex } from '@/domain/enums/sex';
import Entity from '@/domain/entities/dependant/dependant';
import Email from '@/domain/value-objects/email/email';
import Dto from '@/domain/dtos/dependant.dto';

export default class DependantMapper {
  static toEntity(model: Model): Entity {
    return new Entity({
      id: model.id,
      firstName: model.first_name,
      lastName: model.last_name,
      familyId: model.family_id,
      birthdate: new Birthdate(model.birthdate.toISOString().split('T')[0]),
      relationship: model.relationship as DependantRelationship,
      sex: model.sex as Sex,
      email: model.email ? new Email(model.email) : undefined,
      phone: model.phone ?? undefined,
    });
  }

  //todo: abstract the model. do not couple to prisma model
  static toModel(entity: Entity): Omit<Model, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      sex: entity.sex,
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
      sex: entity.sex,
      id: entity.id,
    };
  }
}
