import { Inject, Injectable } from '@nestjs/common';

import { TRAINING_QUERY, TrainingQuery } from '@/application/queries/training-query/training.query';
import { TrainingListItemView } from '@/application/queries/training-query/training-list-item.view';

@Injectable()
export class ListTrainings {
  constructor(
    @Inject(TRAINING_QUERY)
    private readonly trainingQuery: TrainingQuery,
  ) {}

  async execute(): Promise<TrainingListItemView[]> {
    return this.trainingQuery.trainingsListView();
  }
}
