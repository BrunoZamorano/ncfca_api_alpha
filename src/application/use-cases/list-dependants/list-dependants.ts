import { Inject } from '@nestjs/common';

import { QUERY_SERVICE, QueryService } from '@/application/services/query.service';
import { DependantsListItemView } from '@/application/queries/dependant-query/dependants-list-item.view';

export default class ListDependants {
  constructor(@Inject(QUERY_SERVICE) private readonly query: QueryService) {}

  async execute(): Promise<DependantsListItemView[]> {
    return await this.query.dependantQuery.dependantsListView();
  }
}
