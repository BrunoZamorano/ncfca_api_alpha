import { UnprocessableEntityException } from '@nestjs/common';
import {
  Registration as Model,
  RegistrationStatus as PrismaRegistrationStatus,
  TournamentType as PrismaTournamentType,
  RegistrationSync as RegistrationSyncModel,
} from '@prisma/client';

import Registration from '@/domain/entities/registration/registration.entity';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import { RegistrationStatus } from '@/domain/enums/registration-status.enum';

import { RegistrationSyncMapper } from './registration-sync.mapper';

export default class RegistrationMapper {
  static modelToEntity(model: Model & { sync?: RegistrationSyncModel }): Registration {
    if (!model.sync) throw new UnprocessableEntityException('Registration model must have a sync property');
    return Registration.fromPersistence({
      id: model.id,
      type: TournamentType[model.type as keyof typeof TournamentType],
      sync: RegistrationSyncMapper.toEntity(model.sync),
      status: RegistrationStatus[model.status as keyof typeof RegistrationStatus],
      version: model.version,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
      partnerId: model.partner_id,
      tournamentId: model.tournament_id,
      competitorId: model.competitor_id,
    });
  }

  static entityToModel(entity: Registration): Model {
    return {
      id: entity.id,
      type: entity.type as PrismaTournamentType,
      status: entity.status as PrismaRegistrationStatus,
      version: entity.version || 1,
      partner_id: entity.partnerId || null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      tournament_id: entity.tournamentId,
      competitor_id: entity.competitorId,
    };
  }
}
