import { Tournament as Model, TournamentType as PrismaTournamentType } from '@prisma/client';
import Tournament from '@/domain/entities/tournament/tournament.entity';
import { TournamentType } from '@/domain/enums/tournament-type.enum';

export default class TournamentMapper {
  static modelToEntity(model: Model): Tournament {
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
      registrationCount: 0, // Will be hydrated by repository when needed
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
    };
  }
}
