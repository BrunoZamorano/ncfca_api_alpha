import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CreateTournament } from '@/application/use-cases/tournament/create-tournament.use-case';
import { UpdateTournament } from '@/application/use-cases/tournament/update-tournament.use-case';
import { DeleteTournament } from '@/application/use-cases/tournament/delete-tournament.use-case';
import { ListTournaments } from '@/application/use-cases/tournament/list-tournaments.use-case';
import { GetTournament } from '@/application/use-cases/tournament/get-tournament.use-case';
import { RequestIndividualRegistration } from '@/application/use-cases/tournament/request-individual-registration.use-case';
import { CancelRegistration } from '@/application/use-cases/tournament/cancel-registration.use-case';
import { CreateRegistrationSyncOnRegistrationConfirmed } from '@/application/listeners/create-registration-sync-on-registration-confirmed.listener';
import { PublishIntegrationEventOnRegistrationConfirmed } from '@/application/listeners/publish-integration-event-on-registration-confirmed.listener';

import TournamentController from '@/infraestructure/controllers/tournament/tournament.controller';
import { TournamentListener } from '@/infraestructure/controllers/listeners/tournament.listener';

import SharedModule from '@/shared/modules/shared.module';
import { TOURNAMENT_EVENTS_SERVICE } from '@/shared/constants/service-constants';

@Module({
  imports: [
    ConfigModule,
    SharedModule,
    ClientsModule.registerAsync([
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
  controllers: [TournamentController, TournamentListener],
  providers: [
    CreateTournament,
    UpdateTournament,
    DeleteTournament,
    ListTournaments,
    GetTournament,
    RequestIndividualRegistration,
    CancelRegistration,
    CreateRegistrationSyncOnRegistrationConfirmed,
    PublishIntegrationEventOnRegistrationConfirmed,
  ],
  exports: [ClientsModule],
})
export default class TournamentModule {}
