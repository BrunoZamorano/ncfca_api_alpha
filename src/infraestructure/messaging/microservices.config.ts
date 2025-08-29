import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

export function connectMicroservices(app: INestApplication) {
  const configService = app.get(ConfigService);

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL') || ''],
      queue: 'ClubRequest',
      queueOptions: {
        durable: true,
      },
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5,
        clientProperties: {
          connection_name: 'ncfca-api-microservice',
        },
      },
      prefetchCount: 1,
      isGlobalPrefetch: false,
      noAck: false,
    },
  });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL') || ''],
      queue: 'TournamentRegistration',
      queueOptions: {
        durable: true,
      },
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5,
        clientProperties: {
          connection_name: 'ncfca-api-tournament-microservice',
        },
      },
      prefetchCount: 1,
      isGlobalPrefetch: false,
      noAck: false,
    },
  });
}
