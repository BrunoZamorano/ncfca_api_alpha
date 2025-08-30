import { Family as FamilyModel, Dependant as DependantModel } from '@prisma/client';

import { FamilyStatus } from '@/domain/enums/family-status';
import { FamilyDto } from '@/domain/dtos/family.dto';
import Entity from '@/domain/entities/family/family';
import Family from '@/domain/entities/family/family';

import DependantMapper from './dependant.mapper';

type Model = FamilyModel & { dependants: DependantModel[] };

export default class FamilyMapper {
  static entityToDto(entity: Family): FamilyDto {
    return {
      id: entity.id,
      status: entity.status,
      holderId: entity.holderId,
      dependants: entity.dependants.map((entity) => DependantMapper.entityToDto(entity)),
      affiliatedAt: entity.affiliatedAt,
      affiliationExpiresAt: entity.affiliationExpiresAt,
    };
  }

  static toDomain(data: Model): Entity {
    const dependants = data.dependants ? data.dependants.map((model) => DependantMapper.toEntity(model)) : [];
    return new Entity({
      id: data.id,
      status: data.status as FamilyStatus,
      holderId: data.holder_id,
      dependants: dependants,
      affiliatedAt: data.affiliated_at,
      affiliationExpiresAt: data.affiliation_expires_at,
    });
  }

  static toPersistence(entity: Entity): Omit<FamilyModel, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      holder_id: entity.holderId,
      status: entity.status,
      affiliated_at: entity.affiliatedAt,
      affiliation_expires_at: entity.affiliationExpiresAt,
    };
  }
}
