import { DomainEvent } from './domain-event';

export class DuoRegistrationAccepted implements DomainEvent<DuoRegistrationAcceptedPayload> {
  public static eventType = 'DuoRegistration.Accepted';
  public readonly eventType = DuoRegistrationAccepted.eventType;

  constructor(public readonly payload: DuoRegistrationAcceptedPayload) {}
}

export interface DuoRegistrationAcceptedPayload {
  registrationId: string;
  tournamentId: string;
  competitorId: string;
  partnerId: string;
}
