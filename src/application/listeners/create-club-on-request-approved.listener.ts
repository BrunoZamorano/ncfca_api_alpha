import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import CreateClub from '@/application/use-cases/create-club/create-club';
import { ClubRequestApprovedEvent } from '@/domain/events/club-request-approved.event';

@Injectable()
export default class CreateClubOnRequestApprovedListener {
  constructor(
    private readonly createClubUseCase: CreateClub,
  ) {}

  @OnEvent('club.request.approved')
  async handle(event: ClubRequestApprovedEvent): Promise<void> {
    const { requestId } = event;
    
    await this.createClubUseCase.execute({requestId});
  }
} 