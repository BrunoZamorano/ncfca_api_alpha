import { Inject } from '@nestjs/common';

import { QUERY_SERVICE, QueryService } from '@/application/services/query.service';
import { GetMyPendingRegistrationsListItemView } from '@/application/queries/tournament-query/get-my-pending-registrations-list-item.view';

export class GetMyPendingRegistrations {
  constructor(@Inject(QUERY_SERVICE) private readonly query: QueryService) {}

  async execute(holderId: string): Promise<GetMyPendingRegistrationsListItemView[]> {
    return await this.query.tournamentQuery.getMyPendingRegistrations(holderId);
  }
}
