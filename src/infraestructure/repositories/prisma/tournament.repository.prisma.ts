import { Injectable } from '@nestjs/common';

import { TournamentRepository } from '@/domain/repositories/tournament.repository';
import Tournament from '@/domain/entities/tournament/tournament.entity';
import TournamentMapper from '@/shared/mappers/tournament.mapper';

import { PrismaService } from '@/infraestructure/database/prisma.service';

@Injectable()
export class PrismaTournamentRepository implements TournamentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(tournament: Tournament): Promise<void> {
    const tournamentData = TournamentMapper.entityToModel(tournament);

    await this.prisma.tournament.upsert({
      where: { id: tournament.id },
      update: tournamentData,
      create: tournamentData,
    });
  }

  async findById(id: string): Promise<Tournament | null> {
    const tournament = await this.prisma.tournament.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!tournament) {
      return null;
    }

    return TournamentMapper.modelToEntity(tournament);
  }
}
