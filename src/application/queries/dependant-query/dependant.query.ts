import { DependantsListItemView } from '@/application/queries/dependant-query/dependants-list-item.view';

export default interface DependantQuery {
  dependantsListView(): Promise<DependantsListItemView[]>;
} 

export const DEPENDANT_QUERY = Symbol('DEPENDANT_QUERY');
