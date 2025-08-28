import { Logger } from "@nestjs/common";
import { DomainEvent } from "./domain-event";

export interface EventEmitter {
  emit<T>(event: DomainEvent<T>): void;
}

export abstract class BaseEventEmitter implements EventEmitter {
  constructor(private readonly logger: Logger) { }

  emit<T>(event: DomainEvent<T>): void {
    this.logger.debug(`[Event] Sending ${event.eventType} with payload: ${JSON.stringify(event.payload)}}`);
    this.publishEvent<T>(event);
  }

  protected abstract publishEvent<T>(event: DomainEvent<T>): void;

}

export abstract class ClubEmitter extends BaseEventEmitter { }

export interface TournamentEmitter extends EventEmitter { }

export interface EventEmitterFacade {
  clubEmitter: ClubEmitter;
  tournamentEmitter: TournamentEmitter;
}