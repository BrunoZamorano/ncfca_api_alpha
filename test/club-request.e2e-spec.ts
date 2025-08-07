import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, INestMicroservice, ValidationPipe } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { UserRoles } from '@/domain/enums/user-roles';
import { ClubRequestStatus } from '@/domain/enums/club-request-status.enum';
import { FamilyStatus } from '@/domain/enums/family-status';
import { HashingServiceBcrypt } from '@/infraestructure/services/hashing-bcrypct.service';
import { CpfGenerator } from '@/infraestructure/services/cpf-generator.service';
import { pollForCondition } from './utils/poll-for-condition';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { delay } from './utils/delay';

describe('ClubRequestController (e2e)', () => {
  let app: INestApplication;
  let microservice: INestMicroservice;
  let prisma: PrismaService;
  let adminAccessToken: string;
  let regularUserAccessToken: string;
  let regularUserId: string;
  let regularUserFamilyId: string;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // 1. Crie a instância da aplicação HTTP a partir do módulo de teste
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

    // 2. Crie a instância do microserviço a partir do MESMO módulo
    microservice = moduleFixture.createNestMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
        queue: 'ClubRequest',
        queueOptions: {
          durable: true,
        },
      },
    });

    // 3. Inicie AMBAS as instâncias
    await app.init();
    await microservice.listen();
    await delay(500);

    prisma = app.get<PrismaService>(PrismaService);

    // await prisma.$transaction([
    //   prisma.clubMembership.deleteMany(),
    //   prisma.enrollmentRequest.deleteMany(),
    //   prisma.training.deleteMany(),
    //   prisma.transaction.deleteMany(),
    //   prisma.dependant.deleteMany(),
    //   prisma.club.deleteMany(),
    //   prisma.clubRequest.deleteMany(),
    //   prisma.family.deleteMany(),
    //   prisma.user.deleteMany(),
    // ]);

    const hashingService = new HashingServiceBcrypt();
    const cpfGenerator = new CpfGenerator();

    const createTestUser = async (email: string, roles: UserRoles[]) => {
      const password = 'Password@123';
      const userData = {
        id: crypto.randomUUID(),
        email,
        password: hashingService.hash(password),
        roles: roles.join(','),
        first_name: 'E2E',
        last_name: 'User',
        cpf: cpfGenerator.gerarCpf(),
        phone: '11999999999',
        city: 'test',
        state: 'TS',
        number: '1',
        street: 'test',
        zip_code: '12345678',
        neighborhood: 'test',
        rg: '123456',
      };
      async function getTestUser() {
        let user = await prisma.user.findUnique({ where: { email: userData.email }, include: { family: true } });
        if (!user) {
          user = await prisma.user.create({ data: userData, include: { family: true } });
          await prisma.family.create({ data: { holder_id: userData.id, status: FamilyStatus.NOT_AFFILIATED } });
        }
        if (!user || !user.family) throw new Error('Failed to create test user');
        return user;
      }
      const testUser = await getTestUser();
      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
      return { accessToken: loginResponse.body.accessToken, userId: testUser.id, familyId: testUser.family!.id };
    };

    const admin = await createTestUser('admin.e2e.final@test.com', [UserRoles.ADMIN]);
    adminAccessToken = admin.accessToken;

    const regular = await createTestUser('user.e2e.final@test.com', []);
    regularUserAccessToken = regular.accessToken;
    regularUserId = regular.userId;
    regularUserFamilyId = regular.familyId;
  });

  afterAll(async () => {
    // 4. Encerre AMBAS as instâncias
    await app.close();
    await microservice.close();
  });

  describe('Full Lifecycle: User Request -> Admin Approval -> Club Creation', () => {
    let clubRequestId: string;
    const clubName = 'Clube Aprovado E2E';

    it('POST /club-requests: User creates a request', async () => {
      const dto = {
        clubName,
        address: {
          street: 'Rua Aprovada',
          number: '1',
          district: 'Bairro',
          city: 'Cidade',
          state: 'ST',
          zipCode: '12345678',
        },
      };
      await request(app.getHttpServer())
        .post('/club-requests')
        .set('Authorization', `Bearer ${regularUserAccessToken}`)
        .send(dto)
        .expect(HttpStatus.ACCEPTED);

      const requestInDb = await prisma.clubRequest.findFirst({
        where: { club_name: clubName, status: ClubRequestStatus.PENDING },
      });
      expect(requestInDb).toBeDefined();
      clubRequestId = requestInDb!.id;
    });

    it('POST /admin/club-requests/:id/approve: Admin approves the request, which asynchronously creates a club', async () => {
      await prisma.family.update({ where: { id: regularUserFamilyId }, data: { status: FamilyStatus.AFFILIATED } });

      await request(app.getHttpServer())
        .post(`/club-requests/${clubRequestId}/approve`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      const updatedRequest = await prisma.clubRequest.findUnique({ where: { id: clubRequestId } });
      expect(updatedRequest?.status).toBe(ClubRequestStatus.APPROVED);

      await pollForCondition(
        async () => {
          const createdClub = await prisma.club.findFirst({ where: { name: clubName } });
          expect(createdClub).toBeDefined();
          expect(createdClub?.principal_id).toBe(regularUserId);
        },
        3000,
        200,
      );
    });
  });

  describe('Authorization and Validation', () => {
    it('should return 403 Forbidden when a non-admin tries to list pending requests', async () => {
      await request(app.getHttpServer())
        .get('/club-requests/pending')
        .set('Authorization', `Bearer ${regularUserAccessToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 401 Unauthorized when no token is provided', async () => {
      await request(app.getHttpServer()).get('/club-requests/pending').expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 Bad Request when rejecting with an invalid reason', async () => {
      const req = await prisma.clubRequest.create({
        data: {
          club_name: 'For Rejection Test',
          requester_id: regularUserId,
          city: 'C',
          state: 'ST',
          number: '1',
          street: 'S',
          zip_code: '12345678',
          neighborhood: 'D',
        },
      });
      await request(app.getHttpServer())
        .post(`/club-requests/${req.id}/reject`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'short' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
