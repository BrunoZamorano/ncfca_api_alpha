import { DomainEvent } from './domain-event';

export class ClubRequestApprovedEvent implements DomainEvent<ClubRequestApprovedEventPayload> {
  public static eventType = 'ClubRequest.Approved';
  public readonly eventType = ClubRequestApprovedEvent.eventType;

  constructor(public readonly payload: ClubRequestApprovedEventPayload) {}
}

export interface ClubRequestApprovedEventPayload {
  requesterId: string;
  requestId: string;
}
