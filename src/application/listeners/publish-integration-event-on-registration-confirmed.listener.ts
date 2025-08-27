import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ClientProxy } from '@nestjs/microservices';
import { RegistrationConfirmed } from '@/domain/events/registration-confirmed.event';
import { TOURNAMENT_EVENTS_SERVICE } from '@/shared/constants/service-constants';

@Injectable()
export class PublishIntegrationEventOnRegistrationConfirmed {
  constructor(@Inject(TOURNAMENT_EVENTS_SERVICE) private readonly client: ClientProxy) {}

  @OnEvent('registration.confirmed')
  handleRegistrationConfirmedEvent(event: RegistrationConfirmed): void {
    const integrationPayload = {
      registrationId: event.registrationId,
      tournamentId: event.tournamentId,
      isDuo: event.isDuo,
      participants: [
        {
          competitorId: event.competitorId,
        },
      ],
    };

    this.client.emit('registration.confirmed', integrationPayload);
  }
}
