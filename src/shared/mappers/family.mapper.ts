import Entity from '@/domain/entities/family/family';
import { Family as FamilyData, Dependant as DependantData } from '@prisma/client';
import DependantMapper from './dependant.mapper';
import { FamilyStatus } from '@/domain/enums/family-status';
import Family from '@/domain/entities/family/family';
import { FamilyDto } from '@/domain/dtos/family.dto';

type Model = FamilyData & { dependants: DependantData[] };

export default class FamilyMapper {
  static entityToDto(entity: Family): FamilyDto {
    return {
      id: entity.id,
      status: entity.status,
      holderId: entity.holderId,
      dependants: entity.dependants.map(DependantMapper.entityToDto),
      affiliatedAt: entity.affiliatedAt,
      affiliationExpiresAt: entity.affiliationExpiresAt,
    };
  }

  static toDomain(data: Model): Entity {
    const dependants = data.dependants ? data.dependants.map(DependantMapper.toEntity) : [];
    return new Entity({
      id: data.id,
      status: data.status as FamilyStatus,
      holderId: data.holder_id,
      dependants: dependants,
      affiliatedAt: data.affiliated_at,
      affiliationExpiresAt: data.affiliation_expires_at,
    });
  }

  static toPersistence(entity: Entity): Omit<FamilyData, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      holder_id: entity.holderId,
      status: entity.status,
      affiliated_at: entity.affiliatedAt,
      affiliation_expires_at: entity.affiliationExpiresAt,
    };
  }
}
