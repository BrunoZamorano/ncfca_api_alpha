import DependantQuery from '@/application/queries/dependant-query/dependant.query';

export interface QueryService {
  readonly dependantQuery: DependantQuery;
}

export const QUERY_SERVICE = Symbol('QUERY_SERVICE');
