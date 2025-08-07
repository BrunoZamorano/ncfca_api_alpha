import { Module } from '@nestjs/common';

import CreateClubOnRequestApprovedListener from '@/application/listeners/create-club-on-request-approved.listener';
import CreateClubRequestUseCase from '@/application/use-cases/create-club-request/create-club-request.use-case';
import RejectClubRequestUseCase from '@/application/use-cases/reject-club-request/reject-club-request.use-case';
import ApproveClubRequest from '@/application/use-cases/club-request/approve-club-request/approve-club-request.use-case';
import CreateClub from '@/application/use-cases/create-club/create-club';

import SharedModule from './shared.module';

@Module({
  imports: [SharedModule],
  providers: [
    CreateClubOnRequestApprovedListener,
    CreateClubRequestUseCase,
    RejectClubRequestUseCase,
    ApproveClubRequest,
    CreateClub,
  ],
  exports: [CreateClubRequestUseCase, ApproveClubRequest, RejectClubRequestUseCase],
})
export default class ClubRequestModule {}
