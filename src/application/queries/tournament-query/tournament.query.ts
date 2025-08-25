import { ListTournamentsQueryDto } from '@/infraestructure/dtos/tournament/list-tournaments-query.dto';
import { TournamentListItemView } from './tournament-list-item.view';
import { TournamentDetailsView } from './tournament-details.view';

export interface TournamentQuery {
  findById(id: string, showDeleted?: boolean): Promise<TournamentDetailsView | null>;
  search(query: ListTournamentsQueryDto): Promise<TournamentListItemView[]>;
}
