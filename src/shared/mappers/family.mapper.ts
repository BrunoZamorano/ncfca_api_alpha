import Entity from '@/domain/entities/family/family';
import { Family as FamilyData, Dependant as DependantData } from '@prisma/client';
import DependantMapper from './dependant.mapper';
import { FamilyStatus } from '@/domain/enums/family-status';

type Model = FamilyData & { dependants: DependantData[] };

export default class FamilyMapper {
  static toDomain(data: Model): Entity {
    const dependants = data.dependants ? data.dependants.map(DependantMapper.toEntity) : [];
    return new Entity({
      id: data.id,
      holderId: data.holder_id,
      status: data.status as FamilyStatus,
      dependants: dependants,
    });
  }

  static toPersistence(entity: Entity): Omit<FamilyData, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      holder_id: entity.holderId,
      status: entity.status,
    };
  }
}
