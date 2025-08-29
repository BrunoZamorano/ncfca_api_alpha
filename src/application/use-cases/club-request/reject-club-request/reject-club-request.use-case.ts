import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import { EventEmitterFacade } from '@/domain/events/event-emitter';

import { CLUB_REQUEST_REPOSITORY } from '@/shared/constants/repository-constants';
import { EVENT_EMITTER_FACADE } from '@/shared/constants/event.constants';

@Injectable()
export default class RejectClubRequestUseCase {
  constructor(
    @Inject(CLUB_REQUEST_REPOSITORY) private readonly clubRequestRepository: ClubRequestRepository,
    @Inject(EVENT_EMITTER_FACADE) private readonly eventEmitter: EventEmitterFacade,
  ) {}

  async execute(input: RejectClubRequestInput): Promise<void> {
    const clubRequest = await this.clubRequestRepository.findById(input.clubRequestId);
    if (!clubRequest) throw new NotFoundException('Solicitação de clube não encontrada');
    clubRequest.reject(input.reason, this.eventEmitter.clubEmitter);
    await this.clubRequestRepository.save(clubRequest);
  }
}

export interface RejectClubRequestInput {
  clubRequestId: string;
  reason: string;
}
