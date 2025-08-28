import { Inject, Injectable } from '@nestjs/common';
import { ClubEmitter, TournamentEmitter, EventEmitterFacade } from '@/domain/events/event-emitter';
import { CLUB_EMITTER, TOURNAMENT_EMITTER } from '@/shared/constants/event.constants';

@Injectable()
export class RMQEventEmitterFacade implements EventEmitterFacade {
  constructor(
    @Inject(TOURNAMENT_EMITTER) public readonly tournamentEmitter: TournamentEmitter,
    @Inject(CLUB_EMITTER) public readonly clubEmitter: ClubEmitter,
  ) {}
}