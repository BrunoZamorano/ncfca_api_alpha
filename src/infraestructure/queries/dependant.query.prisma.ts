import { Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { DependantsListItemView } from '@/application/queries/dependant-query/dependants-list-item.view';
import { DependantQuery } from '@/application/queries/dependant-query/dependant.query';

import { PrismaService } from '@/infraestructure/database/prisma.service';

export class DependantQueryPrisma implements DependantQuery {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async dependantsListView(): Promise<DependantsListItemView[]> {
    return await this.prisma.$queryRaw<DependantsListItemView[]>`
      SELECT id, email, CONCAT(first_name, ' ', last_name) AS name
      FROM "Dependant";`;
  }
}
