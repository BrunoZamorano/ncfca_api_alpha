import { DomainEvent } from './domain-event';

export class DuoRegistrationRequested implements DomainEvent<DuoRegistrationRequestedPayload> {
  public static eventType = 'DuoRegistration.Requested';
  public readonly eventType = DuoRegistrationRequested.eventType;

  constructor(public readonly payload: DuoRegistrationRequestedPayload) {}
}

export interface DuoRegistrationRequestedPayload {
  registrationId: string;
  tournamentId: string;
  competitorId: string;
  partnerId: string;
}
