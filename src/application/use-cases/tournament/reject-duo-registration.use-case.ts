import { Inject, Injectable } from '@nestjs/common';

import { UnitOfWork, UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { EventEmitterFacade } from '@/domain/events/event-emitter';

import { EVENT_EMITTER_FACADE } from '@/shared/constants/event.constants';

@Injectable()
export class RejectDuoRegistration {
  constructor(
    @Inject(EVENT_EMITTER_FACADE) private readonly eventEmitterFacade: EventEmitterFacade,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: RejectDuoRegistrationCommand): Promise<void> {
    return await this.unitOfWork.executeInTransaction(async () => {
      const tournament = await this.unitOfWork.tournamentRepository.findByRegistrationId(input.registrationId);
      if (!tournament) throw new EntityNotFoundException('Tournament', `with registration ${input.registrationId}`);
      tournament.rejectDuoRegistration(input.registrationId, this.eventEmitterFacade.tournamentEmitter);
      await this.unitOfWork.tournamentRepository.save(tournament);
    });
  }
}

export interface RejectDuoRegistrationCommand {
  registrationId: string;
  userId: string;
}
