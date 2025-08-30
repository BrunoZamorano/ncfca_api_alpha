import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { ClubMemberDto } from '@/domain/dtos/club-member.dto';

import {
  setupClubManagementApp,
  createClubOwnerUser,
  createTestClub,
  createTestFamily,
  createTestDependant,
  createTestClubMembership,
  clubManagementCleanup,
  ClubManagementTestUser,
  ClubTestData,
} from './setup';

describe('(E2E) List Club Members', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let clubOwner: ClubManagementTestUser;
  let anotherClubOwner: ClubManagementTestUser;
  let testFamily: ClubManagementTestUser;
  let testClub: ClubTestData;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupClubManagementApp());
  });

  beforeEach(async () => {
    // Criar dono do clube principal
    clubOwner = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwner.userId);

    // Criar segundo dono de clube
    anotherClubOwner = await createClubOwnerUser(app, prisma);
    testUsers.push(anotherClubOwner.userId);

    // Criar família afiliada para testes
    testFamily = await createTestFamily(app, prisma);
    testUsers.push(testFamily.userId);

    // Criar clubes
    testClub = await createTestClub(prisma, clubOwner.userId, {
      name: 'Clube E2E Membros',
    });
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await clubManagementCleanup(prisma, testUsers);
    await app.close();
  });

  describe('GET /club-management/my-club/members', () => {
    it('Deve listar membros ativos do meu clube', async () => {
      // Arrange - Criar dependente e membership ativa
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'Silva',
      });

      const membership = await createTestClubMembership(prisma, testClub.id, dependant.id, testFamily.familyId);

      // Act - Listar membros do clube
      const response: { body: ClubMemberDto[] } = await request(app.getHttpServer())
        .get('/club-management/my-club/members')
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Validar dados retornados conforme ClubMemberDto
      expect(response.body).toHaveLength(1);
      const member = response.body[0];
      expect(member.id).toEqual(membership.id);
      expect(member.firstName).toEqual('João');
      expect(member.lastName).toEqual('Silva');
      expect(member.email).toContain('@testfamily.test');
      expect(member.holder.id).toEqual(testFamily.userId);
      expect(member.holder.email).toContain('@testfamily.test');
      expect(member.memberSince).toBeDefined();
      expect(member.birthDate).toBeDefined();
      expect(member.sex).toBeDefined();
    });

    it('Deve retornar array vazio quando clube não possui membros', async () => {
      // Arrange - Criar novo clube sem membros para isolamento
      const emptyClubOwner = await createClubOwnerUser(app, prisma);
      testUsers.push(emptyClubOwner.userId);

      await createTestClub(prisma, emptyClubOwner.userId, {
        name: 'Clube Vazio E2E',
      });

      // Act - Listar membros de clube vazio
      const response: { body: ClubMemberDto[] } = await request(app.getHttpServer())
        .get('/club-management/my-club/members')
        .set('Authorization', `Bearer ${emptyClubOwner.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Validar array vazio
      expect(response.body).toHaveLength(0);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('Não deve permitir acesso sem token de autenticação', async () => {
      // Arrange - Nenhuma preparação especial

      // Act & Assert - Tentar acessar sem token
      await request(app.getHttpServer()).get('/club-management/my-club/members').expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
