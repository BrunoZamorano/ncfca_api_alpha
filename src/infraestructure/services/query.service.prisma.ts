import { Inject } from '@nestjs/common';

import DependantQuery, { DEPENDANT_QUERY } from '@/application/queries/dependant-query/dependant.query';
import { QueryService } from '@/application/services/query.service';

export default class QueryServicePrisma implements QueryService {
  constructor(@Inject(DEPENDANT_QUERY) readonly dependantQuery: DependantQuery) {}
}
