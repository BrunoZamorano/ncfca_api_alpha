import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DependantRelationship, DependantType, Sex, EnrollmentStatus, MembershipStatus } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { UserRoles } from '@/domain/enums/user-roles';
import { FamilyStatus } from '@/domain/enums/family-status';
import { AppModule } from '@/app.module';
import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';

import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';

export interface ClubManagementTestUser {
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
 * Inicializa a aplicação de teste para os testes E2E de ClubManagement
 */
export async function setupClubManagementApp(): Promise<{ app: NestExpressApplication; prisma: PrismaService }> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>();
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
 * Cria um usuário com role DONO_DE_CLUBE para testes
 */
export async function createClubOwnerUser(
  app: NestExpressApplication,
  prisma: PrismaService,
  familyStatus: FamilyStatus = FamilyStatus.AFFILIATED,
): Promise<ClubManagementTestUser> {
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
  app: NestExpressApplication,
  prisma: PrismaService,
  familyStatus: FamilyStatus = FamilyStatus.AFFILIATED,
): Promise<ClubManagementTestUser> {
  const email = `${crypto.randomUUID()}@regular.test`;
  const user = await createTestUser(email, [UserRoles.SEM_FUNCAO], prisma, app, familyStatus);

  // Se família for AFFILIATED, definir data de expiração
  if (familyStatus === FamilyStatus.AFFILIATED) {
    await activateFamilyAffiliation(prisma, user.familyId);
  }

  return user;
}

/**
 * Cria um usuário admin para testes
 */
export async function createAdminUser(
  app: NestExpressApplication,
  prisma: PrismaService,
  familyStatus: FamilyStatus = FamilyStatus.AFFILIATED,
): Promise<ClubManagementTestUser> {
  const email = `${crypto.randomUUID()}@admin.test`;
  const user = await createTestUser(email, [UserRoles.ADMIN], prisma, app, familyStatus);

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
 * Cria um dependente para testes de enrollment
 */
export async function createTestDependant(
  prisma: PrismaService,
  familyId: string,
  overrides: Partial<{
    firstName: string;
    lastName: string;
    birthDate: Date;
    relationship: DependantRelationship;
    type: DependantType;
    sex: Sex;
    email: string;
    phone: string;
  }> = {},
) {
  const dependantData = {
    id: crypto.randomUUID(),
    first_name: overrides.firstName || 'João',
    last_name: overrides.lastName || 'Silva',
    birthdate: overrides.birthDate || new Date('2010-01-01'),
    relationship: overrides.relationship || DependantRelationship.SON,
    type: overrides.type || DependantType.STUDENT,
    sex: overrides.sex || Sex.MALE,
    email: overrides.email || null,
    phone: overrides.phone || null,
    family_id: familyId,
  };

  return prisma.dependant.create({
    data: dependantData,
  });
}

/**
 * Cria uma solicitação de enrollment para testes
 */
export async function createTestEnrollmentRequest(
  prisma: PrismaService,
  clubId: string,
  memberId: string,
  familyId: string,
  status: EnrollmentStatus = EnrollmentStatus.PENDING,
) {
  return prisma.enrollmentRequest.create({
    data: {
      id: crypto.randomUUID(),
      club_id: clubId,
      member_id: memberId,
      family_id: familyId,
      status: status,
      requested_at: new Date(),
    },
  });
}

/**
 * Cria uma membership ativa para testes
 */
export async function createTestClubMembership(
  prisma: PrismaService,
  clubId: string,
  memberId: string,
  familyId: string,
  status: MembershipStatus = MembershipStatus.ACTIVE,
) {
  return prisma.clubMembership.create({
    data: {
      id: crypto.randomUUID(),
      club_id: clubId,
      member_id: memberId,
      family_id: familyId,
      status: status,
    },
  });
}

/**
 * Cria uma família afiliada para testes
 */
export async function createTestFamily(
  app: NestExpressApplication,
  prisma: PrismaService,
  familyStatus: FamilyStatus = FamilyStatus.AFFILIATED,
): Promise<ClubManagementTestUser> {
  const email = `${crypto.randomUUID()}@testfamily.test`;
  const user = await createTestUser(email, [UserRoles.SEM_FUNCAO], prisma, app, familyStatus);

  // Se família for AFFILIATED, definir data de expiração
  if (familyStatus === FamilyStatus.AFFILIATED) {
    await activateFamilyAffiliation(prisma, user.familyId);
  }

  return user;
}

/**
 * Cleanup cirúrgico específico para testes de ClubManagement
 * Remove apenas os dados relacionados aos userIds fornecidos
 */
export async function clubManagementCleanup(prisma: PrismaService, userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    return;
  }

  await surgicalCleanup(prisma, userIds);
}
