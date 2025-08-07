import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import CreateClubRequestUseCase from '@/application/use-cases/create-club-request/create-club-request.use-case';
import RejectClubRequestUseCase from '@/application/use-cases/reject-club-request/reject-club-request.use-case';
import ApproveClubRequest from '@/application/use-cases/club-request/approve-club-request/approve-club-request.use-case';
import CreateClub from '@/application/use-cases/create-club/create-club';

import { ClubEventsListener } from '@/infraestructure/controllers/listeners/club-events.listener';

import { CLUB_EVENTS_SERVICE } from '@/shared/constants/service-constants';

import SharedModule from './shared.module';

@Module({
  imports: [
    SharedModule,
    ClientsModule.register([
      {
        name: CLUB_EVENTS_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
          queue: 'club_creation_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [ClubEventsListener],
  providers: [CreateClubRequestUseCase, RejectClubRequestUseCase, ApproveClubRequest, CreateClub],
  exports: [CreateClubRequestUseCase, ApproveClubRequest, RejectClubRequestUseCase],
})
export default class ClubRequestModule {}
