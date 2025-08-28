import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import { EventEmitterFacade } from '@/domain/events/event-emitter';

import { CLUB_REQUEST_REPOSITORY } from '@/shared/constants/repository-constants';
import { EVENT_EMITTER_FACADE } from '@/shared/constants/event.constants';

@Injectable()
export default class ApproveClubRequest {
  private readonly logger = new Logger(ApproveClubRequest.name);

  constructor(
    @Inject(CLUB_REQUEST_REPOSITORY) private readonly clubRequestRepository: ClubRequestRepository,
    @Inject(EVENT_EMITTER_FACADE) private readonly eventEmitterFacade: EventEmitterFacade,
  ) {}

  async execute(input: { clubRequestId: string }): Promise<void> {
    this.logger.debug(`[INIT] Approving club request: ${input.clubRequestId}`);
    const clubRequest = await this.clubRequestRepository.findById(input.clubRequestId);
    if (!clubRequest) throw new NotFoundException('ClubRequest', input.clubRequestId);
    clubRequest.approve(this.eventEmitterFacade.clubEmitter);
    await this.clubRequestRepository.save(clubRequest);
  }
}
