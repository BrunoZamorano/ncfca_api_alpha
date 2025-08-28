import { Tournament as Model, TournamentType as PrismaTournamentType, Registration as RegistrationModel } from '@prisma/client';

import { TournamentType } from '@/domain/enums/tournament-type.enum';
import Tournament from '@/domain/entities/tournament/tournament.entity';

import RegistrationMapper from './registration.mapper';

export default class TournamentMapper {
  static modelToEntity(model: Model & { registrations?: RegistrationModel[] }): Tournament {
    const registrations = model.registrations ? model.registrations.map((reg) => RegistrationMapper.modelToEntity(reg)) : [];

    return new Tournament({
      id: model.id,
      name: model.name,
      type: model.type as TournamentType,
      version: model.version,
      startDate: model.start_date,
      deletedAt: model.deleted_at,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
      description: model.description,
      registrations: registrations,
      registrationEndDate: model.registration_end_date,
      registrationStartDate: model.registration_start_date,
    });
  }

  static entityToModel(entity: Tournament): Model {
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type as PrismaTournamentType,
      version: entity.version,
      deleted_at: entity.deletedAt,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      start_date: entity.startDate,
      description: entity.description,
      registration_end_date: entity.registrationEndDate,
      registration_start_date: entity.registrationStartDate,
    };
  }
}
