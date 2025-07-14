import { Module } from '@nestjs/common';

import SearchClubs from '@/application/use-cases/search-clubs/search-clubs';
import GetClubInfo from '@/application/use-cases/get-club-info/get-club-info';
import CreateClub from '@/application/use-cases/create-club/create-club';

import ClubController from '@/infraestructure/controllers/club/club.controller';

import SharedModule from '@/shared/modules/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [ClubController],
  providers: [SearchClubs, CreateClub, GetClubInfo],
  exports: [],
})
export default class ClubModule {}
