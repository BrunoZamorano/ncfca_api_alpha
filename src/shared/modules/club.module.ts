import { Module } from '@nestjs/common';

import SearchClubs from '@/application/use-cases/club/search-clubs/search-clubs';
import GetClubInfo from '@/application/use-cases/club/get-club-info/get-club-info';
import CreateClub from '@/application/use-cases/club/create-club/create-club';

import ClubController from '@/infraestructure/controllers/club/club.controller';

import SharedModule from '@/shared/modules/shared.module';
import ListClubMembers from '@/application/use-cases/club/list-club-members/list-club-members';

@Module({
  imports: [SharedModule],
  controllers: [ClubController],
  providers: [SearchClubs, CreateClub, GetClubInfo, ListClubMembers],
  exports: [],
})
export default class ClubModule {}
