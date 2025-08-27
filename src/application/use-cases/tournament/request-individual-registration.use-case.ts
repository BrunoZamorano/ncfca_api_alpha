import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { TournamentRepository } from '@/domain/repositories/tournament.repository';
import FamilyRepository from '@/domain/repositories/family-repository';
import Registration from '@/domain/entities/registration/registration.entity';
import IdGenerator from '@/application/services/id-generator';
import { EntityNotFoundException, OptimisticLockError } from '@/domain/exceptions/domain-exception';
import { RegistrationConfirmed } from '@/domain/events/registration-confirmed.event';

import { TOURNAMENT_REPOSITORY } from '@/shared/constants/repository-constants';
import { FAMILY_REPOSITORY } from '@/shared/constants/repository-constants';
import { ID_GENERATOR, TOURNAMENT_EVENTS_SERVICE } from '@/shared/constants/service-constants';

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
    @Inject(TOURNAMENT_EVENTS_SERVICE) private readonly client: ClientProxy,
    private readonly eventEmitter: EventEmitter2,
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
        throw new ConflictException('Competitor is already registered for this tournament.');
      }
      throw error;
    }

    // Create event object for both local and RabbitMQ emission
    const event = new RegistrationConfirmed(
      registration.id,
      registration.tournamentId,
      registration.competitorId,
      false, // Individual registration, not duo
    );

    // Emit locally first to create RegistrationSync
    this.eventEmitter.emit('registration.confirmed', event);


    // Then emit via RabbitMQ to trigger status update to SYNCED
    this.client.emit('Registration.Confirmed', event);

    return registration;
  }
}
