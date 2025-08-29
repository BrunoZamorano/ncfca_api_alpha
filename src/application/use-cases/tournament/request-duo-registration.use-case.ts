import { Inject, Injectable } from '@nestjs/common';

import { UnitOfWork, UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { EventEmitterFacade } from '@/domain/events/event-emitter';
import Registration from '@/domain/entities/registration/registration.entity';

import IdGenerator from '@/application/services/id-generator';

import { EVENT_EMITTER_FACADE } from '@/shared/constants/event.constants';
import { ID_GENERATOR } from '@/shared/constants/service-constants';

@Injectable()
export class RequestDuoRegistration {
  constructor(
    @Inject(EVENT_EMITTER_FACADE) private readonly eventEmitterFacade: EventEmitterFacade,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: RequestDuoRegistrationInput): Promise<Registration> {
    return await this.unitOfWork.executeInTransaction(async () => {
      const tournament = await this.unitOfWork.tournamentRepository.findById(input.tournamentId);
      if (!tournament) throw new EntityNotFoundException('Tournament', input.tournamentId);
      const competitor = await this.unitOfWork.familyRepository.findDependant(input.competitorId);
      if (!competitor) throw new EntityNotFoundException('Dependant', input.competitorId);
      const partner = await this.unitOfWork.familyRepository.findDependant(input.partnerId);
      if (!partner) throw new EntityNotFoundException('Dependant', input.partnerId);
      const registration = tournament.requestDuoRegistration(competitor, partner, this.idGenerator, this.eventEmitterFacade.tournamentEmitter);
      await this.unitOfWork.tournamentRepository.save(tournament);
      return registration;
    });
  }
}

export interface RequestDuoRegistrationInput {
  tournamentId: string;
  competitorId: string;
  partnerId: string;
}
