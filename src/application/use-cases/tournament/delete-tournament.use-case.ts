import { Inject, Injectable } from '@nestjs/common';

import { TournamentRepository } from '@/domain/repositories/tournament.repository';
import Tournament from '@/domain/entities/tournament/tournament.entity';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';

import { TOURNAMENT_REPOSITORY } from '@/shared/constants/repository-constants';

@Injectable()
export class DeleteTournament {
  constructor(
    @Inject(TOURNAMENT_REPOSITORY) private readonly tournamentRepository: TournamentRepository,
  ) {}

  async execute(id: string): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new EntityNotFoundException('Tournament', id);
    }

    tournament.softDelete();
    await this.tournamentRepository.save(tournament);
    return tournament;
  }
}
