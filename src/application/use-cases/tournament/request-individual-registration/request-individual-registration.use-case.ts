import { Inject, Injectable } from '@nestjs/common';

import { EntityNotFoundException, OptimisticLockError } from '@/domain/exceptions/domain-exception';
import { UnitOfWork, UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import { EventEmitterFacade } from '@/domain/events/event-emitter';
import Registration from '@/domain/entities/registration/registration.entity';

import IdGenerator from '@/application/services/id-generator';

import { EVENT_EMITTER_FACADE } from '@/shared/constants/event.constants';
import { ID_GENERATOR } from '@/shared/constants/service-constants';

@Injectable()
export class RequestIndividualRegistration {
  constructor(
    @Inject(EVENT_EMITTER_FACADE) private readonly eventEmitterFacade: EventEmitterFacade,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
  ) {}

  //todo: security: it is possible to register a dependant from other family to a tournament. Raise solutions... 
  async execute(props: RequestIndividualRegistrationProps): Promise<Registration> {
    return await this.unitOfWork.executeInTransaction(async () => {
      const tournament = await this.unitOfWork.tournamentRepository.findById(props.tournamentId);
      if (!tournament) throw new EntityNotFoundException('Tournament', props.tournamentId);
      const competitor = await this.unitOfWork.familyRepository.findDependant(props.competitorId);
      if (!competitor) throw new EntityNotFoundException('Dependant', props.competitorId);
      const registration = tournament.requestIndividualRegistration(competitor, this.idGenerator, this.eventEmitterFacade.tournamentEmitter);
      await this.unitOfWork.tournamentRepository.save(tournament);
      return registration;
    });
  }
}

export interface RequestIndividualRegistrationProps {
  tournamentId: string;
  competitorId: string;
}
