import { Registration as Model, RegistrationStatus as PrismaRegistrationStatus, TournamentType as PrismaTournamentType } from '@prisma/client';
import Registration from '@/domain/entities/registration/registration.entity';
import RegistrationSync from '@/domain/entities/registration/registration-sync.entity';
import { RegistrationStatus } from '@/domain/enums/registration-status.enum';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import { SyncStatus } from '@/domain/entities/registration/registration-sync.entity';

export default class RegistrationMapper {
  static modelToEntity(model: Model & { registrationSync?: any }): Registration {
    // Create RegistrationSync if exists
    let sync: RegistrationSync;
    if (model.registrationSync) {
      sync = RegistrationSync.fromPersistence({
        id: model.registrationSync.id,
        registrationId: model.id,
        status: model.registrationSync.status as SyncStatus,
        attempts: model.registrationSync.attempts || 0,
        lastAttemptAt: model.registrationSync.lastAttemptAt,
        nextAttemptAt: model.registrationSync.nextAttemptAt,
        createdAt: model.registrationSync.createdAt,
        updatedAt: model.registrationSync.updatedAt,
      });
    } else {
      // Create default sync if not provided
      sync = RegistrationSync.fromPersistence({
        id: `${model.id}-sync`,
        registrationId: model.id,
        status: SyncStatus.PENDING,
        attempts: 0,
        lastAttemptAt: null,
        nextAttemptAt: null,
        createdAt: model.created_at,
        updatedAt: model.updated_at,
      });
    }

    return Registration.fromPersistence({
      id: model.id,
      tournamentId: model.tournament_id,
      competitorId: model.competitor_id,
      partnerId: model.partner_id,
      version: model.version,
      status: RegistrationStatus[model.status as keyof typeof RegistrationStatus],
      type: TournamentType[model.type as keyof typeof TournamentType],
      createdAt: model.created_at,
      updatedAt: model.updated_at,
      sync,
    });
  }

  static entityToModel(entity: Registration): Model {
    return {
      id: entity.id,
      type: entity.type as PrismaTournamentType,
      status: entity.status as PrismaRegistrationStatus,
      tournament_id: entity.tournamentId,
      competitor_id: entity.competitorId,
      partner_id: entity.partnerId || null,
      version: entity.version || 1,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
