import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { TournamentRepository } from '@/domain/repositories/tournament.repository';
import Registration from '@/domain/entities/registration/registration.entity';
import { EntityNotFoundException, OptimisticLockError } from '@/domain/exceptions/domain-exception';

import { TOURNAMENT_REPOSITORY } from '@/shared/constants/repository-constants';

export interface CancelRegistrationProps {
  registrationId: string;
  reason: string;
}

@Injectable()
export class CancelRegistration {
  constructor(@Inject(TOURNAMENT_REPOSITORY) private readonly tournamentRepository: TournamentRepository) {}

  async execute(props: CancelRegistrationProps): Promise<Registration> {
    const tournament = await this.tournamentRepository.findByRegistrationId(props.registrationId);
    if (!tournament) {
      throw new EntityNotFoundException('Registration', props.registrationId);
    }

    const registration = tournament.cancelRegistration(props.registrationId);

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
