import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { UserRoles } from '@/domain/enums/user-roles';
import { FamilyStatus } from '@/domain/enums/family-status';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import { AppModule } from '@/app.module';
import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';

import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';

export interface TournamentTestUser {
  userId: string;
  familyId: string;
  accessToken: string;
}

export interface TournamentTestData {
  id: string;
  name: string;
  description: string;
  type: TournamentType;
  registrationStartDate: Date;
  registrationEndDate: Date;
  startDate: Date;
  deletedAt?: Date | null;
}

/**
 * Inicializa a aplicação de teste para os testes E2E do Tournament Controller
 */
export async function setupTournamentApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>();
  const configService = moduleFixture.get(ConfigService);

  // Configure microservices for E2E tests  
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
      },
      prefetchCount: 1,
      noAck: false,
    },
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.set('query parser', 'extended');
  
  await app.startAllMicroservices();
  await app.init();

  const prisma = app.get(PrismaService);

  return { app, prisma };
}

/**
 * Ativa afiliação da família definindo data de expiração no futuro
 */
async function activateFamilyAffiliation(prisma: PrismaService, familyId: string): Promise<void> {
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 1); // 1 ano no futuro

  await prisma.family.update({
    where: { id: familyId },
    data: {
      status: FamilyStatus.AFFILIATED,
      affiliation_expires_at: expirationDate,
    },
  });
}

/**
 * Cria um usuário administrador para testes do Tournament Controller
 */
export async function createAdminUser(
  app: INestApplication,
  prisma: PrismaService,
  familyStatus: FamilyStatus = FamilyStatus.AFFILIATED,
): Promise<TournamentTestUser> {
  const email = `${crypto.randomUUID()}@tournamentadmin.test`;
  const user = await createTestUser(email, [UserRoles.ADMIN], prisma, app, familyStatus);

  // Se família for AFFILIATED, definir data de expiração
  if (familyStatus === FamilyStatus.AFFILIATED) {
    await activateFamilyAffiliation(prisma, user.familyId);
  }

  return user;
}

/**
 * Cria um usuário holder (dono de clube) para testes do Tournament Controller
 */
export async function createHolderUser(
  app: INestApplication,
  prisma: PrismaService,
  familyStatus: FamilyStatus = FamilyStatus.AFFILIATED,
): Promise<TournamentTestUser> {
  const email = `${crypto.randomUUID()}@tournamentholder.test`;
  const user = await createTestUser(email, [UserRoles.DONO_DE_CLUBE], prisma, app, familyStatus);

  // Se família for AFFILIATED, definir data de expiração
  if (familyStatus === FamilyStatus.AFFILIATED) {
    await activateFamilyAffiliation(prisma, user.familyId);
  }

  return user;
}

/**
 * Cria um usuário regular sem privilégios para testes
 */
export async function createRegularUser(
  app: INestApplication,
  prisma: PrismaService,
  familyStatus: FamilyStatus = FamilyStatus.AFFILIATED,
): Promise<TournamentTestUser> {
  const email = `${crypto.randomUUID()}@tournamentuser.test`;
  const user = await createTestUser(email, [UserRoles.SEM_FUNCAO], prisma, app, familyStatus);

  // Se família for AFFILIATED, definir data de expiração
  if (familyStatus === FamilyStatus.AFFILIATED) {
    await activateFamilyAffiliation(prisma, user.familyId);
  }

  return user;
}

/**
 * Cria um torneio no Prisma para testes
 */
export async function createTestTournament(
  prisma: PrismaService,
  overrides: Partial<{
    name: string;
    description: string;
    type: TournamentType;
    registrationStartDate: Date;
    registrationEndDate: Date;
    startDate: Date;
    deletedAt: Date | null;
  }> = {},
): Promise<TournamentTestData> {
  const now = new Date();
  const registrationStart = new Date(now.getTime() + 1000 * 60 * 60 * 24); // 1 dia no futuro
  const registrationEnd = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // 7 dias no futuro
  const tournamentStart = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 10); // 10 dias no futuro

  const tournamentData = {
    id: crypto.randomUUID(),
    name: overrides.name || `Torneio E2E ${crypto.randomUUID().substring(0, 8)}`,
    description: overrides.description || `Descrição do torneio de teste ${crypto.randomUUID().substring(0, 8)} para validação E2E`,
    type: overrides.type || TournamentType.INDIVIDUAL,
    registration_start_date: overrides.registrationStartDate || registrationStart,
    registration_end_date: overrides.registrationEndDate || registrationEnd,
    start_date: overrides.startDate || tournamentStart,
    deleted_at: overrides.deletedAt || null,
  };

  const tournament = await prisma.tournament.create({
    data: tournamentData,
  });

  return {
    id: tournament.id,
    name: tournament.name,
    description: tournament.description,
    type: tournament.type as TournamentType,
    registrationStartDate: tournament.registration_start_date,
    registrationEndDate: tournament.registration_end_date,
    startDate: tournament.start_date,
    deletedAt: tournament.deleted_at,
  };
}

/**
 * Cria um torneio deletado (soft delete) para testes
 */
export async function createDeletedTestTournament(
  prisma: PrismaService,
  overrides: Partial<{
    name: string;
    description: string;
    type: TournamentType;
  }> = {},
): Promise<TournamentTestData> {
  return createTestTournament(prisma, {
    ...overrides,
    deletedAt: new Date(),
  });
}

/**
 * Cleanup cirúrgico específico para testes do Tournament Controller
 * Remove apenas os dados relacionados aos userIds e tournamentIds fornecidos
 */
export async function tournamentCleanup(prisma: PrismaService, userIds: string[], tournamentIds: string[] = []): Promise<void> {
  if (userIds.length === 0 && tournamentIds.length === 0) {
    return;
  }

  await surgicalCleanup(prisma, userIds, tournamentIds);
}
