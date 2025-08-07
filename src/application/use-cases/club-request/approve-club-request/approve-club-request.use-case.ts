import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ClubRequestApprovedEvent } from '@/domain/events/club-request-approved.event';
import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';

import { Queue } from '@/application/services/queue';

import { CLUB_REQUEST_REPOSITORY } from '@/shared/constants/repository-constants';
import { QUEUE_SERVICE } from '@/shared/constants/service-constants';

@Injectable()
export default class ApproveClubRequest {
  constructor(
    @Inject(CLUB_REQUEST_REPOSITORY) private readonly clubRequestRepository: ClubRequestRepository,
    @Inject(QUEUE_SERVICE) private readonly queue: Queue,
  ) {}

  async execute(input: ApproveClubRequestInput): Promise<void> {
    const clubRequest = await this.clubRequestRepository.findById(input.clubRequestId);
    if (!clubRequest) {
      throw new NotFoundException('Solicitação de clube não encontrada');
    }
    clubRequest.approve();
    await this.clubRequestRepository.save(clubRequest);
    const event = new ClubRequestApprovedEvent(clubRequest.id);
    await this.queue.publish('Club', event);
  }
}

export interface ApproveClubRequestInput {
  clubRequestId: string;
}
