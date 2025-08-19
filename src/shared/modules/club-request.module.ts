import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import CreateClubRequestUseCase from '@/application/use-cases/club-request/create-club-request/create-club-request.use-case';
import RejectClubRequestUseCase from '@/application/use-cases/club-request/reject-club-request/reject-club-request.use-case';
import ApproveClubRequest from '@/application/use-cases/club-request/approve-club-request/approve-club-request.use-case';
import GetUserClubRequestsUseCase from '@/application/use-cases/club-request/get-user-club-requests/get-user-club-requests.use-case';
import ListPendingClubRequestsUseCase from '@/application/use-cases/club-request/list-pending-club-requests/list-pending-club-requests.use-case';
import CreateClub from '@/application/use-cases/club/create-club/create-club';
import SharedModule from './shared.module';
import { CLUB_EVENTS_SERVICE } from '@/shared/constants/service-constants';
import { ClubEventsListener } from '@/infraestructure/controllers/listeners/club-events.listener';
import ClubRequestController from '@/infraestructure/controllers/club-request.controller';

@Module({
  imports: [
    SharedModule,
    ClientsModule.register([
      {
        name: CLUB_EVENTS_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || ''],
          queue: 'ClubRequest',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [ClubEventsListener, ClubRequestController],
  providers: [
    CreateClubRequestUseCase,
    RejectClubRequestUseCase,
    ApproveClubRequest,
    GetUserClubRequestsUseCase,
    ListPendingClubRequestsUseCase,
    CreateClub,
  ],
  exports: [CreateClubRequestUseCase, ApproveClubRequest, RejectClubRequestUseCase, ClientsModule],
})
export default class ClubRequestModule {}
