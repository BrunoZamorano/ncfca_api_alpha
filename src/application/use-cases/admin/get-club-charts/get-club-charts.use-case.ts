import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { GetClubChartsQuery } from './get-club-charts.query';
import { GetClubChartsQueryPrisma, ClubChartsData } from '@/infraestructure/queries/get-club-charts.query.prisma';

@Injectable()
export default class AdminGetClubChartsUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    private readonly clubChartsQuery: GetClubChartsQueryPrisma,
  ) {}

  async execute(query: GetClubChartsQuery): Promise<ClubChartsData> {
    // Verificar se o clube existe
    const club = await this.uow.clubRepository.find(query.clubId);
    if (!club) {
      throw new EntityNotFoundException('Club', query.clubId);
    }

    // Executar query para obter dados dos gráficos
    return await this.clubChartsQuery.execute(query.clubId);
  }
}
