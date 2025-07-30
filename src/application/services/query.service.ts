import { EnrollmentQuery } from '@/application/queries/enrollment-query/enrollment.query';
import { DependantQuery } from '@/application/queries/dependant-query/dependant.query';

export interface QueryService {
  readonly dependantQuery: DependantQuery;
  readonly enrollmentQuery: EnrollmentQuery;
}

export const QUERY_SERVICE = Symbol('QUERY_SERVICE');
