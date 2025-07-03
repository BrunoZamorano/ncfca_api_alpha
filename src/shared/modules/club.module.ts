import { Module } from '@nestjs/common';

import SearchClubs from '@/application/use-cases/search-clubs/search-clubs';

import ClubController from '@/infraestructure/controllers/club/club.controller';

import SharedModule from '@/shared/modules/shared-module';

@Module({
  imports: [SharedModule],
  controllers: [ClubController],
  providers: [SearchClubs],
  exports: [],
})
export default class ClubModule {}
