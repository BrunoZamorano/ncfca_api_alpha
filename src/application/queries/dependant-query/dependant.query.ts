import { DependantsListItemView } from '@/application/queries/dependant-query/dependants-list-item.view';

export interface DependantQuery {
  dependantsListView(): Promise<DependantsListItemView[]>;
}
