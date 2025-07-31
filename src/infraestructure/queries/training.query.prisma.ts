import { Inject } from '@nestjs/common';

import { TrainingListItemView } from '@/application/queries/training-query/training-list-item.view';
import { TrainingQuery } from '@/application/queries/training-query/training.query';

import { PrismaService } from '@/infraestructure/database/prisma.service';

export class TrainingQueryPrisma implements TrainingQuery {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async trainingsListView(): Promise<TrainingListItemView[]> {
    return await this.prisma.$queryRaw<TrainingListItemView[]>`
      SELECT id, title, description, youtube_url as "youtubeUrl"
      FROM "Training";`;
  }
}
