import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TournamentEmitter } from '@/domain/events/event-emitter';
import { TOURNAMENT_EVENTS_SERVICE } from '@/shared/constants/event.constants';
import { DomainEvent } from '@/domain/events/domain-event';

@Injectable()
export class RMQTournamentEmitter implements TournamentEmitter {
  constructor(@Inject(TOURNAMENT_EVENTS_SERVICE) private readonly client: ClientProxy) { }

  emit<T>(event: DomainEvent<T>): void {
    this.client.emit(event.eventType, event.payload);
  }
}