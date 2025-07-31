import { EnrollmentQuery } from '@/application/queries/enrollment-query/enrollment.query';
import { DependantQuery } from '@/application/queries/dependant-query/dependant.query';
import { TrainingQuery } from '@/application/queries/training-query/training.query';

export interface QueryService {
  readonly enrollmentQuery: EnrollmentQuery;
  readonly dependantQuery: DependantQuery;
  readonly trainingQuery: TrainingQuery;
}

export const QUERY_SERVICE = Symbol('QUERY_SERVICE');
