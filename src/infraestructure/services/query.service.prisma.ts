import { Inject } from '@nestjs/common';

import { EnrollmentQuery, ENROLLMENT_QUERY } from '@/application/queries/enrollment-query/enrollment.query';
import { DependantQuery, DEPENDANT_QUERY } from '@/application/queries/dependant-query/dependant.query';
import { TrainingQuery, TRAINING_QUERY } from '@/application/queries/training-query/training.query';
import { QueryService } from '@/application/services/query.service';

export default class QueryServicePrisma implements QueryService {
  constructor(
    @Inject(TRAINING_QUERY) readonly trainingQuery: TrainingQuery,
    @Inject(DEPENDANT_QUERY) readonly dependantQuery: DependantQuery,
    @Inject(ENROLLMENT_QUERY) readonly enrollmentQuery: EnrollmentQuery,
  ) {}
}
