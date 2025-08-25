import { Module } from '@nestjs/common';

import { CreateTournament } from '@/application/use-cases/tournament/create-tournament.use-case';
import { UpdateTournament } from '@/application/use-cases/tournament/update-tournament.use-case';
import { DeleteTournament } from '@/application/use-cases/tournament/delete-tournament.use-case';
import { ListTournaments } from '@/application/use-cases/tournament/list-tournaments.use-case';
import { GetTournament } from '@/application/use-cases/tournament/get-tournament.use-case';

import TournamentController from '@/infraestructure/controllers/tournament/tournament.controller';

import SharedModule from '@/shared/modules/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [TournamentController],
  providers: [
    CreateTournament,
    UpdateTournament,
    DeleteTournament,
    ListTournaments,
    GetTournament,
  ],
  exports: [],
})
export default class TournamentModule {}