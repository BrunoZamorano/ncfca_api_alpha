import { Controller, Inject } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { ClubRequestApprovedEvent } from '@/domain/events/club-request-approved.event';
import CreateClub from '@/application/use-cases/create-club/create-club';

@Controller()
export class ClubEventsListener {
  constructor(@Inject(CreateClub) private readonly createClub: CreateClub) {}

  @MessagePattern('ClubRequest.Approved')
  async handleClubRequestApproved(@Payload() data: ClubRequestApprovedEvent): Promise<void> {
    await this.createClub.execute({ requestId: data.requestId });
  }
}
