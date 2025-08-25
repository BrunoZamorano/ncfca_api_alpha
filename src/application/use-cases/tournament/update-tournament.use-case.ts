import { Inject, Injectable } from '@nestjs/common';

import { TournamentRepository } from '@/domain/repositories/tournament.repository';
import Tournament, { UpdateTournamentProps } from '@/domain/entities/tournament/tournament.entity';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';

import { TOURNAMENT_REPOSITORY } from '@/shared/constants/repository-constants';

export interface UpdateTournamentInput {
  id: string;
  data: UpdateTournamentProps;
}

@Injectable()
export class UpdateTournament {
  constructor(@Inject(TOURNAMENT_REPOSITORY) private readonly tournamentRepository: TournamentRepository) {}

  async execute(input: UpdateTournamentInput): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findById(input.id);
    if (!tournament) {
      throw new EntityNotFoundException('Tournament', input.id);
    }

    tournament.update(input.data);
    await this.tournamentRepository.save(tournament);
    return tournament;
  }
}
