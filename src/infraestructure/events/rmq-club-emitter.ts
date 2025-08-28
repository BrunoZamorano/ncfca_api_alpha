import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { ClubEmitter } from '@/domain/events/event-emitter';
import { DomainEvent } from '@/domain/events/domain-event';

import { CLUB_EVENTS_SERVICE } from '@/shared/constants/event.constants';

@Injectable()
export class RMQClubEmitter extends ClubEmitter {
  constructor(@Inject(CLUB_EVENTS_SERVICE) private readonly client: ClientProxy) {
    super(new Logger(RMQClubEmitter.name));
  }

  publishEvent<T>(event: DomainEvent<T>): void {
    this.client.emit<any, T>(event.eventType, event.payload);
  }
}
