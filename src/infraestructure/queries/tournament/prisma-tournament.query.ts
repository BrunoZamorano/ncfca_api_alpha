import { Inject } from '@nestjs/common';

import { TournamentQuery } from '@/application/queries/tournament-query/tournament.query';
import { TournamentDetailsView } from '@/application/queries/tournament-query/tournament-details.view';
import { TournamentListItemView } from '@/application/queries/tournament-query/tournament-list-item.view';
import { ListTournamentsQueryDto } from '@/infraestructure/dtos/tournament/list-tournaments-query.dto';

import { PrismaService } from '@/infraestructure/database/prisma.service';

export class PrismaTournamentQuery implements TournamentQuery {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string, showDeleted = false): Promise<TournamentDetailsView | null> {
    const query = await this.prisma.tournament.findUnique({
      where: {
        id: id,
        ...(showDeleted ? {} : { deleted_at: null }),
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        created_at: true,
        start_date: true,
        registration_end_date: true,
        registration_start_date: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return query
      ? {
          id: query.id,
          name: query.name,
          type: query.type,
          description: query.description,
          createdAt: query.created_at,
          startDate: query.start_date,
          registrationEndDate: query.registration_end_date,
          registrationStartDate: query.registration_start_date,
          registrationCount: query._count.registrations,
        }
      : null;
  }

  async search(query: ListTournamentsQueryDto): Promise<TournamentListItemView[]> {
    const { filter, pagination } = query;
    const where = { ...(filter?.showDeleted ? {} : { deleted_at: null }) };
    if (filter?.name) Object.assign(where, { name: { contains: filter.name, mode: 'insensitive' } });
    if (filter?.type) Object.assign(where, { type: filter.type });
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const offset = (page - 1) * limit;
    const tournaments = await this.prisma.tournament.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        _count: { select: { registrations: true } },
        start_date: true,
        registration_end_date: true,
        registration_start_date: true,
      },
      where,
      skip: offset,
      take: limit,
      orderBy: { created_at: 'desc' },
    });
    return tournaments.map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      type: tournament.type,
      startDate: tournament.start_date,
      registrationCount: tournament._count.registrations,
      registrationEndDate: tournament.registration_end_date,
      registrationStartDate: tournament.registration_start_date,
    }));
  }
}
