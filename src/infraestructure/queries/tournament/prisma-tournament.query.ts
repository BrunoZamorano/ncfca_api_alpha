import { Inject } from '@nestjs/common';

import { TournamentQuery } from '@/application/queries/tournament-query/tournament.query';
import { TournamentDetailsView } from '@/application/queries/tournament-query/tournament-details.view';
import { TournamentListItemView } from '@/application/queries/tournament-query/tournament-list-item.view';
import { ListTournamentsQueryDto } from '@/infraestructure/dtos/tournament/list-tournaments-query.dto';

import { PrismaService } from '@/infraestructure/database/prisma.service';

export class PrismaTournamentQuery implements TournamentQuery {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string, showDeleted = false): Promise<TournamentDetailsView | null> {
    const tournament = await this.prisma.tournament.findFirst({
      where: {
        id,
        ...(showDeleted ? {} : { deleted_at: null }),
      },
    });

    if (!tournament) {
      return null;
    }

    return {
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      type: tournament.type,
      registrationStartDate: tournament.registration_start_date,
      registrationEndDate: tournament.registration_end_date,
      startDate: tournament.start_date,
      registrationCount: 0,
      deletedAt: tournament.deleted_at || undefined,
      createdAt: tournament.created_at,
      updatedAt: tournament.updated_at,
    };
  }

  async search(query: ListTournamentsQueryDto): Promise<TournamentListItemView[]> {
    const { filter, pagination } = query;
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const offset = (page - 1) * limit;

    const whereConditions: any = {
      ...(filter?.showDeleted ? {} : { deleted_at: null }),
    };

    if (filter?.name) {
      whereConditions.name = {
        contains: filter.name,
        mode: 'insensitive',
      };
    }

    if (filter?.type) {
      whereConditions.type = filter.type;
    }

    const tournaments = await this.prisma.tournament.findMany({
      where: whereConditions,
      orderBy: {
        created_at: 'desc',
      },
      skip: offset,
      take: limit,
    });

    return tournaments.map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      type: tournament.type,
      registrationStartDate: tournament.registration_start_date,
      registrationEndDate: tournament.registration_end_date,
      startDate: tournament.start_date,
      registrationCount: 0,
    }));
  }
}