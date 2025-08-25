import { Inject, Injectable } from '@nestjs/common';

import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { TournamentDetailsView } from '@/application/queries/tournament-query/tournament-details.view';
import { QueryService, QUERY_SERVICE } from '@/application/services/query.service';

@Injectable()
export class GetTournament {
  constructor(@Inject(QUERY_SERVICE) private readonly queryService: QueryService) {}

  async execute(id: string): Promise<TournamentDetailsView> {
    const tournament = await this.queryService.tournamentQuery.findById(id);
    if (!tournament) {
      throw new EntityNotFoundException('Tournament', id);
    }

    return tournament;
  }
}
