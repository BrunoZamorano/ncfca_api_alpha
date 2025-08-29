import { DomainEvent } from './domain-event';

export class DuoRegistrationRejected implements DomainEvent<DuoRegistrationRejectedPayload> {
  public static eventType = 'DuoRegistration.Rejected';
  public readonly eventType = DuoRegistrationRejected.eventType;

  constructor(public readonly payload: DuoRegistrationRejectedPayload) {}
}

export interface DuoRegistrationRejectedPayload {
  registrationId: string;
  tournamentId: string;
  competitorId: string;
  partnerId: string;
}
