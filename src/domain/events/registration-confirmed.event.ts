import { DomainEvent } from './domain-event';

export class RegistrationConfirmed implements DomainEvent<RegistrationConfirmedPayload> {
  public static eventType = 'Registration.Confirmed';
  public readonly eventType = RegistrationConfirmed.eventType;

  constructor(public readonly payload: RegistrationConfirmedPayload) {}
}

export interface RegistrationConfirmedPayload {
  registrationId: string;
  tournamentId: string;
  competitorId: string;
  isDuo: boolean;
}
