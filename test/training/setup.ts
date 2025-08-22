import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Training } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { UserRoles } from '@/domain/enums/user-roles';
import { FamilyStatus } from '@/domain/enums/family-status';
import { AppModule } from '@/app.module';
import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';

import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';

export interface TrainingTestUser {
  userId: string;
  familyId: string;
  accessToken: string;
}

/**
 * Inicializa a aplicação de teste para os testes E2E de Training
 */
export async function setupTrainingApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
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
 * Cria um usuário admin para testes
 */
export async function createAdminUser(
  app: INestApplication,
  prisma: PrismaService,
  familyStatus: FamilyStatus = FamilyStatus.AFFILIATED,
): Promise<TrainingTestUser> {
  const email = `${crypto.randomUUID()}@admin.test`;
  const user = await createTestUser(email, [UserRoles.ADMIN], prisma, app, familyStatus);

  // Se família for AFFILIATED, definir data de expiração
  if (familyStatus === FamilyStatus.AFFILIATED) {
    await activateFamilyAffiliation(prisma, user.familyId);
  }

  return user;
}

/**
 * Cria um usuário com role DONO_DE_CLUBE para testes
 */
export async function createClubOwnerUser(
  app: INestApplication,
  prisma: PrismaService,
  familyStatus: FamilyStatus = FamilyStatus.AFFILIATED,
): Promise<TrainingTestUser> {
  const email = `${crypto.randomUUID()}@clubowner.test`;
  const user = await createTestUser(email, [UserRoles.DONO_DE_CLUBE], prisma, app, familyStatus);

  // Se família for AFFILIATED, definir data de expiração
  if (familyStatus === FamilyStatus.AFFILIATED) {
    await activateFamilyAffiliation(prisma, user.familyId);
  }

  return user;
}

/**
 * Cria um usuário regular (SEM_FUNCAO) para testes
 */
export async function createRegularUser(
  app: INestApplication,
  prisma: PrismaService,
  familyStatus: FamilyStatus = FamilyStatus.AFFILIATED,
): Promise<TrainingTestUser> {
  const email = `${crypto.randomUUID()}@regular.test`;
  const user = await createTestUser(email, [UserRoles.SEM_FUNCAO], prisma, app, familyStatus);

  // Se família for AFFILIATED, definir data de expiração
  if (familyStatus === FamilyStatus.AFFILIATED) {
    await activateFamilyAffiliation(prisma, user.familyId);
  }

  return user;
}

/**
 * Cria um treinamento no Prisma para testes
 */
export async function createTestTraining(
  prisma: PrismaService,
  overrides: Partial<{
    title: string;
    description: string;
    youtubeUrl: string;
  }> = {},
): Promise<Training> {
  const trainingData = {
    id: crypto.randomUUID(),
    title: overrides.title || `Treinamento E2E ${crypto.randomUUID().substring(0, 8)}`,
    description: overrides.description || 'Descrição do treinamento de teste E2E',
    youtube_url: overrides.youtubeUrl || 'https://youtube.com/watch?v=test123',
  };

  return prisma.training.create({
    data: trainingData,
  });
}

/**
 * Cleanup cirúrgico específico para testes de Training
 * Remove apenas os dados relacionados aos userIds fornecidos
 */
export async function trainingCleanup(prisma: PrismaService, userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    return;
  }

  await surgicalCleanup(prisma, userIds);
}
