import { Inject, Injectable } from '@nestjs/common';

import { TournamentListItemView } from '@/application/queries/tournament-query/tournament-list-item.view';
import { ListTournamentsQueryDto } from '@/infraestructure/dtos/tournament/list-tournaments-query.dto';
import { QueryService, QUERY_SERVICE } from '@/application/services/query.service';

@Injectable()
export class ListTournaments {
  constructor(@Inject(QUERY_SERVICE) private readonly queryService: QueryService) {}

  async execute(query: ListTournamentsQueryDto): Promise<TournamentListItemView[]> {
    return await this.queryService.tournamentQuery.search(query);
  }
}
