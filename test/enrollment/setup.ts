import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DependantRelationship, DependantType, Sex } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { UserRoles } from '@/domain/enums/user-roles';
import { FamilyStatus } from '@/domain/enums/family-status';
import { AppModule } from '@/app.module';
import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';

import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';

export interface EnrollmentTestUser {
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
 * Inicializa a aplicação de teste para os testes E2E de Enrollment
 */
export async function setupEnrollmentApp(): Promise<{ app: NestExpressApplication; prisma: PrismaService }> {
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
 * Cria um usuário regular para testes com família afiliada
 */
export async function createRegularUser(app: NestExpressApplication, prisma: PrismaService): Promise<EnrollmentTestUser> {
  const email = `${crypto.randomUUID()}@enrollment.test`;
  const user = await createTestUser(email, [UserRoles.SEM_FUNCAO], prisma, app, FamilyStatus.NOT_AFFILIATED);

  // Ativar afiliação da família
  await activateFamilyAffiliation(prisma, user.familyId);

  return {
    userId: user.userId,
    familyId: user.familyId,
    accessToken: user.accessToken,
  };
}

/**
 * Cria um clube no Prisma para testes com um principal
 */
export async function createTestClub(prisma: PrismaService, principalId: string): Promise<ClubTestData> {
  const clubData = {
    id: crypto.randomUUID(),
    name: `Clube Enrollment E2E ${crypto.randomUUID().substring(0, 8)}`,
    principal_id: principalId,
    city: 'Cidade Enrollment',
    state: 'TE',
    street: 'Rua Enrollment E2E',
    number: '123',
    zip_code: '12345678',
    neighborhood: 'Bairro Enrollment',
    complement: null,
    max_members: null,
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
 * Cria um dependente para uma família específica
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
    first_name: overrides.firstName || 'Maria',
    last_name: overrides.lastName || 'Enrollment',
    birthdate: overrides.birthDate || new Date('2012-03-15'),
    relationship: overrides.relationship || DependantRelationship.DAUGHTER,
    type: overrides.type || DependantType.STUDENT,
    sex: overrides.sex || Sex.FEMALE,
    email: overrides.email || null,
    phone: overrides.phone || null,
    family_id: familyId,
  };

  return prisma.dependant.create({
    data: dependantData,
  });
}

/**
 * Cleanup cirúrgico específico para testes de Enrollment
 * Remove apenas os dados relacionados aos userIds fornecidos
 */
export async function enrollmentCleanup(prisma: PrismaService, userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    return;
  }

  await surgicalCleanup(prisma, userIds);
}
