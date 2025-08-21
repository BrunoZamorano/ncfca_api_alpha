import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ClientProxy, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { UserRoles } from '@/domain/enums/user-roles';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { AppModule } from '@/app.module';
import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';
import { ClubRequestStatus } from '@/domain/enums/club-request-status.enum';
import { CLUB_EVENTS_SERVICE } from '@/shared/constants/service-constants';
import { pollForCondition } from '../utils/poll-for-condition';

describe('E2E ApproveClubRequest', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let client: ClientProxy;
  let admin: { userId: string; familyId: string; accessToken: string };
  let regularUser: { userId: string; familyId: string; accessToken: string };
  const testUsers: string[] = [];

  const createClubRequest = (data: {
    club_name: string;
    requester_id: string;
    status: ClubRequestStatus;
    resolved_at?: Date;
    rejection_reason?: string;
  }) => {
    return prisma.clubRequest.create({
      data: {
        id: crypto.randomUUID(),
        city: 'Cidade',
        state: 'TS',
        street: 'Rua Teste',
        number: '123',
        zip_code: '12123123',
        neighborhood: 'bairro',
        max_members: 50,
        ...data,
      },
    });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: ['log', 'error', 'warn', 'debug', 'verbose'] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

    const configService = moduleFixture.get(ConfigService);

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
        },
        prefetchCount: 1,
        noAck: false,
      },
    });

    await app.startAllMicroservices();
    await app.init();

    prisma = app.get(PrismaService);
    client = app.get(CLUB_EVENTS_SERVICE);
    await client.connect();
    admin = await createTestUser(`admin-${crypto.randomUUID()}@test.com`, [UserRoles.ADMIN], prisma, app);
    regularUser = await createTestUser(`user-${crypto.randomUUID()}@test.com`, [UserRoles.SEM_FUNCAO], prisma, app);
    testUsers.push(admin.userId, regularUser.userId);
  });

  afterAll(async () => {
    await surgicalCleanup(prisma, testUsers);
    await client.close();
    await app.close();
  }, 10000);

  afterEach(async () => {
    await prisma.clubMembership.deleteMany({
      where: {
        club: {
          principal_id: {
            in: [admin.userId, regularUser.userId],
          },
        },
      },
    });
    await prisma.enrollmentRequest.deleteMany({
      where: {
        club: {
          principal_id: {
            in: [admin.userId, regularUser.userId],
          },
        },
      },
    });
    await prisma.club.deleteMany({
      where: {
        principal_id: {
          in: [admin.userId, regularUser.userId],
        },
      },
    });
    await prisma.clubRequest.deleteMany({
      where: {
        requester_id: {
          in: [admin.userId, regularUser.userId],
        },
      },
    });
  });

  it('Deve aprovar solicitação pendente e criar o clube', async () => {
    await prisma.family.update({
      where: { holder_id: regularUser.userId },
      data: { status: 'AFFILIATED' },
    });

    const clubRequest = await createClubRequest({
      club_name: 'Clube Aprovado E2E',
      requester_id: regularUser.userId,
      status: ClubRequestStatus.PENDING,
    });

    await request(app.getHttpServer())
      .post(`/club-requests/${clubRequest.id}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(HttpStatus.NO_CONTENT);

    await pollForCondition(async () => {
      const updatedRequest = await prisma.clubRequest.findUnique({
        where: { id: clubRequest.id },
      });
      expect(updatedRequest?.status).toBe(ClubRequestStatus.APPROVED);
      expect(updatedRequest?.resolved_at).toBeDefined();

      const createdClub = await prisma.club.findFirst({
        where: { principal_id: regularUser.userId },
      });
      expect(createdClub).toBeDefined();
      expect(createdClub!.name).toBe('Clube Aprovado E2E');
      expect(createdClub!.max_members).toBe(50);
      expect(createdClub!.city).toBe('Cidade');
      expect(createdClub!.state).toBe('TS');
    }, 10000);
  }, 15000);

  it('Não deve aprovar solicitação já aprovada', async () => {
    const clubRequest = await createClubRequest({
      club_name: 'Clube Já Aprovado',
      requester_id: regularUser.userId,
      status: ClubRequestStatus.APPROVED,
      resolved_at: new Date(),
    });

    await request(app.getHttpServer())
      .post(`/club-requests/${clubRequest.id}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('Não deve aprovar solicitação já rejeitada', async () => {
    const clubRequest = await createClubRequest({
      club_name: 'Clube Rejeitado',
      requester_id: regularUser.userId,
      status: ClubRequestStatus.REJECTED,
      resolved_at: new Date(),
      rejection_reason: 'Motivo teste',
    });

    await request(app.getHttpServer())
      .post(`/club-requests/${clubRequest.id}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('Não deve aprovar solicitação inexistente', async () => {
    const fakeId = crypto.randomUUID();

    await request(app.getHttpServer())
      .post(`/club-requests/${fakeId}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(HttpStatus.NOT_FOUND);
  });

  it('Não deve permitir aprovação por usuário não-admin', async () => {
    const clubRequest = await createClubRequest({
      club_name: 'Clube Pendente',
      requester_id: admin.userId,
      status: ClubRequestStatus.PENDING,
    });

    await request(app.getHttpServer())
      .post(`/club-requests/${clubRequest.id}/approve`)
      .set('Authorization', `Bearer ${regularUser.accessToken}`)
      .expect(HttpStatus.FORBIDDEN);

    const unchangedRequest = await prisma.clubRequest.findUnique({
      where: { id: clubRequest.id },
    });
    expect(unchangedRequest?.status).toBe(ClubRequestStatus.PENDING);
  });

  it('Não deve permitir aprovação sem autenticação', async () => {
    const clubRequest = await createClubRequest({
      club_name: 'Clube Pendente',
      requester_id: regularUser.userId,
      status: ClubRequestStatus.PENDING,
    });

    await request(app.getHttpServer()).post(`/club-requests/${clubRequest.id}/approve`).expect(HttpStatus.UNAUTHORIZED);
  });

  it('Não deve permitir aprovação com token inválido', async () => {
    const clubRequest = await createClubRequest({
      club_name: 'Clube Pendente',
      requester_id: regularUser.userId,
      status: ClubRequestStatus.PENDING,
    });

    await request(app.getHttpServer())
      .post(`/club-requests/${clubRequest.id}/approve`)
      .set('Authorization', 'Bearer token-invalido')
      .expect(HttpStatus.UNAUTHORIZED);
  });
});
