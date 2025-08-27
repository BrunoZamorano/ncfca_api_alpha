import { Registration as Model, RegistrationStatus as PrismaRegistrationStatus, RegistrationType as PrismaRegistrationType } from '@prisma/client';
import Registration from '@/domain/entities/registration/registration.entity';
import { RegistrationStatus } from '@/domain/enums/registration-status.enum';
import { RegistrationType } from '@/domain/enums/registration-type.enum';

export default class RegistrationMapper {
  static modelToEntity(model: Model): Registration {
    return new Registration({
      id: model.id,
      tournamentId: model.tournament_id,
      competitorId: model.competitor_id,
      status: RegistrationStatus[model.status as keyof typeof RegistrationStatus],
      type: RegistrationType[model.type as keyof typeof RegistrationType],
      createdAt: model.created_at,
      updatedAt: model.updated_at,
    });
  }

  static entityToModel(entity: Registration): Omit<Model, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      tournament_id: entity.tournamentId,
      competitor_id: entity.competitorId,
      status: entity.status as PrismaRegistrationStatus,
      type: entity.type as PrismaRegistrationType,
    };
  }
}