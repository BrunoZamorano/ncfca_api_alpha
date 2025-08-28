import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';

import { RMQEventEmitterFacade } from '@/infraestructure/events/rmq-event-emitter.facade';
import { EventEmitterFacade, ClubEmitter, TournamentEmitter } from '@/domain/events/event-emitter';
import { CLUB_EVENTS_SERVICE, TOURNAMENT_EVENTS_SERVICE, EVENT_EMITTER_FACADE, CLUB_EMITTER, TOURNAMENT_EMITTER } from '@/shared/constants/event.constants';
import { RMQClubEmitter } from '@/infraestructure/events/rmq-club-emitter';
import { RMQTournamentEmitter } from '@/infraestructure/events/rmq-tournament-emitter';

describe('RabbitMqEventEmitter (Unit)', () => {
  let eventEmitterFacade: EventEmitterFacade;
  let clubEmitter: ClubEmitter;
  let tournamentEmitter: TournamentEmitter;
  let clubClient: ClientProxy;
  let tournamentClient: ClientProxy;

  beforeEach(async () => {
    const mockClubClient = {
      emit: jest.fn(),
      send: jest.fn().mockReturnValue(of({ success: true })),
      connect: jest.fn(),
      close: jest.fn(),
    };

    const mockTournamentClient = {
      emit: jest.fn(),
      send: jest.fn().mockReturnValue(of({ result: 'tournament response' })),
      connect: jest.fn(),
      close: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RMQEventEmitterFacade,
        RMQClubEmitter,
        RMQTournamentEmitter,
        {
          provide: EVENT_EMITTER_FACADE,
          useClass: RMQEventEmitterFacade,
        },
        {
          provide: CLUB_EMITTER,
          useClass: RMQClubEmitter,
        },
        {
          provide: TOURNAMENT_EMITTER,
          useClass: RMQTournamentEmitter,
        },
        {
          provide: CLUB_EVENTS_SERVICE,
          useValue: mockClubClient,
        },
        {
          provide: TOURNAMENT_EVENTS_SERVICE,
          useValue: mockTournamentClient,
        },
      ],
    }).compile();

    eventEmitterFacade = module.get<EventEmitterFacade>(EVENT_EMITTER_FACADE);
    clubEmitter = module.get<ClubEmitter>(CLUB_EMITTER);
    tournamentEmitter = module.get<TournamentEmitter>(TOURNAMENT_EMITTER);
    clubClient = module.get<ClientProxy>(CLUB_EVENTS_SERVICE);
    tournamentClient = module.get<ClientProxy>(TOURNAMENT_EVENTS_SERVICE);
  });

  describe('RabbitMqEventEmitter Interface Implementation', () => {
    it('should be defined', () => {
      expect(eventEmitterFacade).toBeDefined();
      expect(clubEmitter).toBeDefined();
      expect(tournamentEmitter).toBeDefined();
      expect(eventEmitterFacade).toBeInstanceOf(RMQEventEmitterFacade);
    });

    it('should implement EventEmitter interfaces', () => {
      expect(typeof clubEmitter.emit).toBe('function');
      expect(typeof tournamentEmitter.emit).toBe('function');
    });
  });

  describe('emit method', () => {
    it('should call club emitter emit method', () => {
      const mockEvent = {
        eventType: 'club.created',
        payload: { clubId: '123' }
      };
      clubEmitter.emit(mockEvent);
      expect(clubClient.emit).toHaveBeenCalledWith('club.created', { clubId: '123' });
    });

    it('should call tournament emitter emit method', () => {
      const mockEvent = {
        eventType: 'tournament.created',
        payload: { tournamentId: '456' }
      };
      tournamentEmitter.emit(mockEvent);
      expect(tournamentClient.emit).toHaveBeenCalledWith('tournament.created', { tournamentId: '456' });
    });
  });

  describe('Dependency Injection', () => {
    it('should have access to mocked ClientProxy instances', () => {
      expect(clubClient).toBeDefined();
      expect(tournamentClient).toBeDefined();
      expect(typeof clubClient.emit).toBe('function');
      expect(typeof clubClient.send).toBe('function');
      expect(typeof tournamentClient.emit).toBe('function');
      expect(typeof tournamentClient.send).toBe('function');
    });
  });
});
