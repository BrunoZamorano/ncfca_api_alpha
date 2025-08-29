import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CreateTournament } from '@/application/use-cases/tournament/create-tournament.use-case';
import { UpdateTournament } from '@/application/use-cases/tournament/update-tournament.use-case';
import { DeleteTournament } from '@/application/use-cases/tournament/delete-tournament.use-case';
import { ListTournaments } from '@/application/use-cases/tournament/list-tournaments.use-case';
import { GetTournament } from '@/application/use-cases/tournament/get-tournament.use-case';
import { RequestIndividualRegistration } from '@/application/use-cases/tournament/request-individual-registration/request-individual-registration.use-case';
import { RequestDuoRegistration } from '@/application/use-cases/tournament/request-duo-registration.use-case';
import { CancelRegistration } from '@/application/use-cases/tournament/cancel-registration.use-case';
import { SyncRegistrationUseCase } from '@/application/use-cases/tournament/sync-registration.use-case';

import TournamentController from '@/infraestructure/controllers/tournament/tournament.controller';
import { TournamentListener } from '@/infraestructure/controllers/listeners/tournament.listener';

import SharedModule from '@/shared/modules/shared.module';
import EventModule from '@/shared/modules/event.module';

@Module({
  imports: [ConfigModule, SharedModule, EventModule],
  controllers: [TournamentController, TournamentListener],
  providers: [
    GetTournament,
    ListTournaments,
    CreateTournament,
    UpdateTournament,
    DeleteTournament,
    CancelRegistration,
    RequestDuoRegistration,
    SyncRegistrationUseCase,
    RequestIndividualRegistration,
  ],
})
export default class TournamentModule {}
