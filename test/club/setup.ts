import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { UserRoles } from '@/domain/enums/user-roles';
import { FamilyStatus } from '@/domain/enums/family-status';
import { AppModule } from '@/app.module';
import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';

import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';

export interface ClubTestUser {
  userId: string;
  familyId: string;
  accessToken: string;
}

export interface ClubTestData {
  id: string;
  name: string;
  principalId: string;
}

/**
 * Inicializa a aplicação de teste para os testes E2E do Club Controller
 */
export async function setupClubApp(): Promise<{ app: NestExpressApplication; prisma: PrismaService }> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.set('query parser', 'extended');
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
 * Cria um usuário regular para testes do Club Controller
 */
export async function createRegularTestUser(
  app: NestExpressApplication,
  prisma: PrismaService,
  roles: UserRoles[] = [UserRoles.SEM_FUNCAO],
  familyStatus: FamilyStatus = FamilyStatus.AFFILIATED,
): Promise<ClubTestUser> {
  const email = `${crypto.randomUUID()}@clubtest.test`;
  const user = await createTestUser(email, roles, prisma, app, familyStatus);

  // Se família for AFFILIATED, definir data de expiração
  if (familyStatus === FamilyStatus.AFFILIATED) {
    await activateFamilyAffiliation(prisma, user.familyId);
  }

  return user;
}

/**
 * Cria um usuário dono de clube para testes
 */
export async function createClubOwnerUser(
  app: NestExpressApplication,
  prisma: PrismaService,
  familyStatus: FamilyStatus = FamilyStatus.AFFILIATED,
): Promise<ClubTestUser> {
  const email = `${crypto.randomUUID()}@clubowner.test`;
  const user = await createTestUser(email, [UserRoles.DONO_DE_CLUBE], prisma, app, familyStatus);

  // Se família for AFFILIATED, definir data de expiração
  if (familyStatus === FamilyStatus.AFFILIATED) {
    await activateFamilyAffiliation(prisma, user.familyId);
  }

  return user;
}

/**
 * Cria um clube no Prisma para testes
 */
export async function createTestClub(
  prisma: PrismaService,
  principalId: string,
  overrides: Partial<{
    name: string;
    city: string;
    state: string;
    street: string;
    number: string;
    zipCode: string;
    neighborhood: string;
    complement: string;
    maxMembers: number;
  }> = {},
): Promise<ClubTestData> {
  const clubData = {
    id: crypto.randomUUID(),
    name: overrides.name || `Clube E2E ${crypto.randomUUID().substring(0, 8)}`,
    principal_id: principalId,
    city: overrides.city || 'Cidade Teste',
    state: overrides.state || 'TS',
    street: overrides.street || 'Rua E2E',
    number: overrides.number || '123',
    zip_code: overrides.zipCode || '12345678',
    neighborhood: overrides.neighborhood || 'Bairro Teste',
    complement: overrides.complement || null,
    max_members: overrides.maxMembers || null,
  };

  const club = await prisma.club.create({
    data: clubData,
  });

  return {
    id: club.id,
    name: club.name,
    principalId: club.principal_id,
  };
}

/**
 * Cleanup cirúrgico específico para testes do Club Controller
 * Remove apenas os dados relacionados aos userIds fornecidos
 */
export async function clubCleanup(prisma: PrismaService, userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    return;
  }

  await surgicalCleanup(prisma, userIds);
}
