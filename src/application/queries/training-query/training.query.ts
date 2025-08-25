import { TrainingListItemView } from '@/application/queries/training-query/training-list-item.view';

export interface TrainingQuery {
  trainingsListView(): Promise<TrainingListItemView[]>;
}
