import { Inject, Injectable } from '@nestjs/common';

import { TournamentRepository } from '@/domain/repositories/tournament.repository';
import Tournament, { CreateTournamentProps } from '@/domain/entities/tournament/tournament.entity';
import IdGenerator from '@/application/services/id-generator';

import { TOURNAMENT_REPOSITORY } from '@/shared/constants/repository-constants';
import { ID_GENERATOR } from '@/shared/constants/service-constants';

@Injectable()
export class CreateTournament {
  constructor(
    @Inject(TOURNAMENT_REPOSITORY) private readonly tournamentRepository: TournamentRepository,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
  ) {}

  async execute(props: CreateTournamentProps): Promise<Tournament> {
    const tournament = Tournament.create(props, this.idGenerator);
    await this.tournamentRepository.save(tournament);
    return tournament;
  }
}