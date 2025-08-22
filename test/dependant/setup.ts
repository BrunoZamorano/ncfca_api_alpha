import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DependantRelationship, DependantType, Sex } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { UserRoles } from '@/domain/enums/user-roles';
import { FamilyStatus } from '@/domain/enums/family-status';
import { AppModule } from '@/app.module';
import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';

import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';

export interface DependantTestUser {
  userId: string;
  familyId: string;
  accessToken: string;
}

export interface CreateDependantOptions {
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
  relationship?: DependantRelationship;
  type?: DependantType;
  sex?: Sex;
  email?: string;
  phone?: string;
}

/**
 * Inicializa a aplicação de teste para os testes E2E do DependantController
 */
export async function setupDependantApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
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
 * Cria um usuário regular com família afiliada para testes do DependantController
 */
export async function createRegularUser(
  app: INestApplication,
  prisma: PrismaService,
  familyStatus: FamilyStatus = FamilyStatus.AFFILIATED,
): Promise<DependantTestUser> {
  const email = `${crypto.randomUUID()}@dependant.test`;
  const user = await createTestUser(email, [UserRoles.SEM_FUNCAO], prisma, app, familyStatus);

  // Se família for AFFILIATED, definir data de expiração
  if (familyStatus === FamilyStatus.AFFILIATED) {
    await activateFamilyAffiliation(prisma, user.familyId);
  }

  return {
    userId: user.userId,
    familyId: user.familyId,
    accessToken: user.accessToken,
  };
}

/**
 * Cria um usuário admin para testes
 */
export async function createAdminUser(
  app: INestApplication,
  prisma: PrismaService,
  familyStatus: FamilyStatus = FamilyStatus.AFFILIATED,
): Promise<DependantTestUser> {
  const email = `${crypto.randomUUID()}@admin.test`;
  const user = await createTestUser(email, [UserRoles.ADMIN], prisma, app, familyStatus);

  // Se família for AFFILIATED, definir data de expiração
  if (familyStatus === FamilyStatus.AFFILIATED) {
    await activateFamilyAffiliation(prisma, user.familyId);
  }

  return {
    userId: user.userId,
    familyId: user.familyId,
    accessToken: user.accessToken,
  };
}

/**
 * Cria um dependente para uma família específica nos testes
 */
export async function createTestDependant(
  prisma: PrismaService,
  familyId: string,
  options: CreateDependantOptions = {},
) {
  const dependantData = {
    id: crypto.randomUUID(),
    first_name: options.firstName || 'João',
    last_name: options.lastName || 'Dependant',
    birthdate: options.birthDate || new Date('2012-01-15'),
    relationship: options.relationship || DependantRelationship.SON,
    type: options.type || DependantType.STUDENT,
    sex: options.sex || Sex.MALE,
    email: options.email || null,
    phone: options.phone || null,
    family_id: familyId,
  };

  return prisma.dependant.create({
    data: dependantData,
  });
}

/**
 * Cria múltiplos dependentes para testes que precisam de mais dados
 */
export async function createMultipleTestDependants(
  prisma: PrismaService,
  familyId: string,
  count: number = 3,
): Promise<any[]> {
  const dependants: any[] = [];
  
  for (let i = 0; i < count; i++) {
    const dependant = await createTestDependant(prisma, familyId, {
      firstName: `Dependente${i + 1}`,
      lastName: `Test`,
      birthDate: new Date(`201${i}-0${i + 1}-15`),
      relationship: i === 0 ? DependantRelationship.SON : 
                   i === 1 ? DependantRelationship.DAUGHTER : 
                   DependantRelationship.OTHER,
      type: i < 2 ? DependantType.STUDENT : DependantType.ALUMNI,
      sex: i % 2 === 0 ? Sex.MALE : Sex.FEMALE,
    });
    
    dependants.push(dependant);
  }
  
  return dependants;
}

/**
 * Cria um dependente com dados específicos para testes de validação
 */
export async function createValidationTestDependant(
  prisma: PrismaService,
  familyId: string,
  scenario: 'valid' | 'future-birth' | 'invalid-relationship' = 'valid',
) {
  let birthDate: Date;
  let relationship: DependantRelationship;

  switch (scenario) {
    case 'future-birth':
      birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() + 1); // Data no futuro
      relationship = DependantRelationship.SON;
      break;
    case 'invalid-relationship':
      birthDate = new Date('2010-01-01');
      relationship = DependantRelationship.OTHER; // Para testar cenários específicos
      break;
    default:
      birthDate = new Date('2012-01-01');
      relationship = DependantRelationship.SON;
  }

  return createTestDependant(prisma, familyId, {
    firstName: 'Validation',
    lastName: 'Test',
    birthDate: birthDate,
    relationship: relationship,
    type: DependantType.STUDENT,
    sex: Sex.MALE,
  });
}

/**
 * Cria uma família adicional para testes de isolamento (cross-family access)
 */
export async function createIsolatedFamily(
  app: INestApplication,
  prisma: PrismaService,
): Promise<{ user: DependantTestUser; dependant: any }> {
  const user = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
  const dependant = await createTestDependant(prisma, user.familyId, {
    firstName: 'Isolated',
    lastName: 'Family',
    relationship: DependantRelationship.DAUGHTER,
    sex: Sex.FEMALE,
  });

  return { user, dependant };
}

/**
 * Cleanup cirúrgico específico para testes do DependantController
 * Remove apenas os dados relacionados aos userIds fornecidos
 */
export async function dependantCleanup(prisma: PrismaService, userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    return;
  }

  await surgicalCleanup(prisma, userIds);
}