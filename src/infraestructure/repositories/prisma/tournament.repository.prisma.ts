import { Injectable } from '@nestjs/common';

import { TournamentRepository } from '@/domain/repositories/tournament.repository';
import Tournament from '@/domain/entities/tournament/tournament.entity';
import TournamentMapper from '@/shared/mappers/tournament.mapper';
import { OptimisticLockError } from '@/domain/exceptions/domain-exception';

import { PrismaService } from '@/infraestructure/database/prisma.service';

@Injectable()
export class PrismaTournamentRepository implements TournamentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(tournament: Tournament): Promise<void> {
    const tournamentData = TournamentMapper.entityToModel(tournament);

    try {
      const result = await this.prisma.tournament.updateMany({
        where: { 
          id: tournament.id,
          version: tournament.version - 1 
        },
        data: {
          ...tournamentData,
          updated_at: new Date(),
        },
      });

      if (result.count === 0) {
        const existingTournament = await this.prisma.tournament.findFirst({
          where: { id: tournament.id, deleted_at: null },
        });

        if (existingTournament) {
          throw new OptimisticLockError('Tournament', tournament.id);
        }

        await this.prisma.tournament.create({
          data: {
            ...tournamentData,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }
    } catch (error) {
      if (error instanceof OptimisticLockError) {
        throw error;
      }
      throw error;
    }
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
