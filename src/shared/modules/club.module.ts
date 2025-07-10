import { Module } from '@nestjs/common';

import SearchClubs from '@/application/use-cases/search-clubs/search-clubs';

import ClubController from '@/infraestructure/controllers/club/club.controller';

import SharedModule from '@/shared/modules/shared.module';
import CreateClub from '@/application/use-cases/create-club/create-club';

@Module({
  imports: [SharedModule],
  controllers: [ClubController],
  providers: [SearchClubs, CreateClub],
  exports: [],
})
export default class ClubModule {}
