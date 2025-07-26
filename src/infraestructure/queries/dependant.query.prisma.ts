import DependantQuery from '@/application/queries/dependant-query/dependant.query';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { DependantsListItemView } from '@/application/queries/dependant-query/dependants-list-item.view';

export class DependantQueryPrisma implements DependantQuery {
  constructor(private readonly prisma: PrismaService) {}

  async dependantsListView(): Promise<DependantsListItemView[]> {
    return await this.prisma.$queryRaw<DependantsListItemView[]>`
      SELECT id, email, CONCAT(first_name, ' ', last_name) AS name
      FROM "Dependant";`;
  }
}
