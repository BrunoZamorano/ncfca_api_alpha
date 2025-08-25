import { Inject, Injectable } from '@nestjs/common';

import { TrainingQuery } from '@/application/queries/training-query/training.query';
import { TRAINING_QUERY } from '@/shared/constants/query-constants';
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
