import { DomainEvent } from "./domain-event";

export class ClubRequestRejectedEvent implements DomainEvent<ClubRequestRejectedEventPayload> {
  public static eventType = 'ClubRequest.Rejected';
  public readonly eventType = ClubRequestRejectedEvent.eventType;

  constructor(
    public readonly payload: ClubRequestRejectedEventPayload
  ) { }

}

interface ClubRequestRejectedEventPayload {
  requesterId: string;
  requestId: string;
  rejectionReason: string;
}
