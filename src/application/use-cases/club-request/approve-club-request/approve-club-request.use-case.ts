import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ClubRequestApprovedEvent } from '@/domain/events/club-request-approved.event';
import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import { CLUB_REQUEST_REPOSITORY } from '@/shared/constants/repository-constants';
import { CLUB_EVENTS_SERVICE } from '@/shared/constants/service-constants';

@Injectable()
export default class ApproveClubRequest {
  private readonly logger = new Logger(ApproveClubRequest.name);

  constructor(
    @Inject(CLUB_REQUEST_REPOSITORY) private readonly clubRequestRepository: ClubRequestRepository,
    @Inject(CLUB_EVENTS_SERVICE) private readonly client: ClientProxy,
  ) {}

  async execute(input: { clubRequestId: string }): Promise<void> {
    this.logger.debug(`[GEMINI_DEBUG] Approving club request: ${input.clubRequestId}`);
    const clubRequest = await this.clubRequestRepository.findById(input.clubRequestId);
    if (!clubRequest) {
      throw new NotFoundException('Solicitação de clube não encontrada');
    }

    clubRequest.approve();
    await this.clubRequestRepository.save(clubRequest);

    const event = new ClubRequestApprovedEvent(clubRequest.id, clubRequest.requesterId);
    this.logger.debug(`[GEMINI_DEBUG] Sending ClubRequest.Approved event for: ${clubRequest.id}`);
    this.client.emit('ClubRequest.Approved', event);
  }
}
