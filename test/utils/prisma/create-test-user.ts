import * as request from 'supertest';
import { NestExpressApplication } from '@nestjs/platform-express';

import { PrismaClient } from '@prisma/client';

import { UserRoles } from '@/domain/enums/user-roles';
import { FamilyStatus } from '@/domain/enums/family-status';

import { CpfGenerator } from '@/infraestructure/services/cpf-generator.service';
import HashingService from '@/domain/services/hashing-service';
import { HASHING_SERVICE } from '@/shared/constants/service-constants';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export async function createTestUser(
  email: string,
  roles: UserRoles[],
  prisma: PrismaClient,
  app: NestExpressApplication,
  familyStatus?: FamilyStatus,
) {
  const cpfGenerator = new CpfGenerator();
  const hashingService = app.get<HashingService>(HASHING_SERVICE);
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
      user.family = await prisma.family.create({ data: { holder_id: userData.id, status: familyStatus ?? FamilyStatus.NOT_AFFILIATED } });
    }
    if (!user || !user.family) throw new Error('Failed to create test user');
    return user;
  }
  const testUser = await getTestUser();
  const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
  const loginBody = loginResponse.body as LoginResponse;
  return { accessToken: loginBody.accessToken, userId: testUser.id, familyId: testUser.family!.id };
}
