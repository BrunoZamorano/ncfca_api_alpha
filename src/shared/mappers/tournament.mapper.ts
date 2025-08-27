import { Tournament as Model, TournamentType as PrismaTournamentType, Registration as RegistrationModel } from '@prisma/client';
import Tournament from '@/domain/entities/tournament/tournament.entity';
import Registration from '@/domain/entities/registration/registration.entity';
import RegistrationMapper from './registration.mapper';
import { TournamentType } from '@/domain/enums/tournament-type.enum';

export default class TournamentMapper {
  static modelToEntity(model: Model & { registrations?: RegistrationModel[] }): Tournament {
    const registrations = model.registrations ? model.registrations.map(reg => RegistrationMapper.modelToEntity(reg)) : [];
    
    return new Tournament({
      id: model.id,
      name: model.name,
      description: model.description,
      type: TournamentType[model.type as keyof typeof TournamentType],
      registrationStartDate: model.registration_start_date,
      registrationEndDate: model.registration_end_date,
      startDate: model.start_date,
      deletedAt: model.deleted_at,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
      registrationCount: registrations.length,
      registrations: registrations,
      version: model.version,
    });
  }

  static entityToModel(entity: Tournament): Omit<Model, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      type: entity.type as PrismaTournamentType,
      registration_start_date: entity.registrationStartDate,
      registration_end_date: entity.registrationEndDate,
      start_date: entity.startDate,
      deleted_at: entity.deletedAt,
      version: entity.version,
    };
  }
}
