import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { TournamentRepository } from '@/domain/repositories/tournament.repository';
import FamilyRepository from '@/domain/repositories/family-repository';
import Tournament from '@/domain/entities/tournament/tournament.entity';
import Registration from '@/domain/entities/registration/registration.entity';
import IdGenerator from '@/application/services/id-generator';
import { EntityNotFoundException, OptimisticLockError } from '@/domain/exceptions/domain-exception';

import { TOURNAMENT_REPOSITORY } from '@/shared/constants/repository-constants';
import { FAMILY_REPOSITORY } from '@/shared/constants/repository-constants';
import { ID_GENERATOR } from '@/shared/constants/service-constants';

export interface RequestIndividualRegistrationProps {
  tournamentId: string;
  competitorId: string;
}

@Injectable()
export class RequestIndividualRegistration {
  constructor(
    @Inject(TOURNAMENT_REPOSITORY) private readonly tournamentRepository: TournamentRepository,
    @Inject(FAMILY_REPOSITORY) private readonly familyRepository: FamilyRepository,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
  ) {}

  async execute(props: RequestIndividualRegistrationProps): Promise<Registration> {
    const tournament = await this.tournamentRepository.findById(props.tournamentId);
    if (!tournament) {
      throw new EntityNotFoundException('Tournament', props.tournamentId);
    }

    const competitor = await this.familyRepository.findDependant(props.competitorId);
    if (!competitor) {
      throw new EntityNotFoundException('Dependant', props.competitorId);
    }

    const registration = tournament.requestIndividualRegistration(competitor, this.idGenerator);

    try {
      await this.tournamentRepository.save(tournament);
    } catch (error) {
      if (error instanceof OptimisticLockError) {
        throw new ConflictException('Tournament has been modified by another process. Please refresh and try again.');
      }
      throw error;
    }

    return registration;
  }
}