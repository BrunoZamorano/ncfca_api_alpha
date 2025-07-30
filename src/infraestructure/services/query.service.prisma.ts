import { Inject } from '@nestjs/common';

import { EnrollmentQuery, ENROLLMENT_QUERY } from '@/application/queries/enrollment-query/enrollment.query';
import { DependantQuery, DEPENDANT_QUERY } from '@/application/queries/dependant-query/dependant.query';
import { QueryService } from '@/application/services/query.service';

export default class QueryServicePrisma implements QueryService {
  constructor(
    @Inject(DEPENDANT_QUERY) readonly dependantQuery: DependantQuery,
    @Inject(ENROLLMENT_QUERY) readonly enrollmentQuery: EnrollmentQuery,
  ) {}
}
