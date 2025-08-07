import { Controller, Inject } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ClubRequestApprovedEvent } from '@/domain/events/club-request-approved.event';
import CreateClub from '@/application/use-cases/create-club/create-club';

@Controller()
export class ClubEventsListener {
  private readonly MAX_RETRIES = 3;
  private readonly retryCount = new Map<string, number>();

  constructor(@Inject(CreateClub) private readonly createClub: CreateClub) {}

  @EventPattern('club_request.approved')
  async handleClubRequestApproved(
    @Payload() data: ClubRequestApprovedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const messageId = originalMsg.properties.messageId || data.requestId;

    try {
      await this.createClub.execute({ requestId: data.requestId });
      channel.ack(originalMsg);
      this.retryCount.delete(messageId);
    } catch (error) {
      console.log(error);
      const retries = (this.retryCount.get(messageId) || 0) + 1;
      if (retries > this.MAX_RETRIES) {
        channel.nack(originalMsg, false, false);
        this.retryCount.delete(messageId);
      } else {
        this.retryCount.set(messageId, retries);
        channel.nack(originalMsg, false, true);
      }
    }
  }
}
