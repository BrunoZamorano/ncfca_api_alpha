import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';

import { RMQEventEmitterFacade } from '@/infraestructure/events/rmq-event-emitter.facade';
import { RMQTournamentEmitter } from '@/infraestructure/events/rmq-tournament-emitter';
import { RMQClubEmitter } from '@/infraestructure/events/rmq-club-emitter';

import {
  TOURNAMENT_EVENTS_SERVICE,
  EVENT_EMITTER_FACADE,
  CLUB_EVENTS_SERVICE,
  TOURNAMENT_EMITTER,
  CLUB_EMITTER,
} from '@/shared/constants/event.constants';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: CLUB_EVENTS_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || ''],
            queue: 'ClubRequest',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: TOURNAMENT_EVENTS_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || ''],
            queue: 'TournamentRegistration',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [
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
  ],
  exports: [EVENT_EMITTER_FACADE, CLUB_EMITTER, TOURNAMENT_EMITTER],
})
export default class EventModule {}
