import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { MembershipStatus } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';

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

describe('(E2E) Revoke Club Membership', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clubOwner: ClubManagementTestUser;
  let anotherClubOwner: ClubManagementTestUser;
  let testFamily: ClubManagementTestUser;
  let testClub: ClubTestData;
  let anotherClub: ClubTestData;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupClubManagementApp());

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
      name: 'Clube E2E Revoke',
    });

    anotherClub = await createTestClub(prisma, anotherClubOwner.userId, {
      name: 'Outro Clube E2E',
    });
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await clubManagementCleanup(prisma, testUsers);
    await app.close();
  });

  describe('POST /club-management/membership/:membershipId/revoke', () => {
    it('Deve revogar a afiliação de um membro ativo', async () => {
      // Arrange - Criar dependente e membership ativa
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'Silva',
      });

      const membership = await createTestClubMembership(prisma, testClub.id, dependant.id, testFamily.familyId, MembershipStatus.ACTIVE);

      // Act - Revogar membership
      await request(app.getHttpServer())
        .post(`/club-management/membership/${membership.id}/revoke`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Assert - Verificar que membership foi revogada no banco
      const updatedMembership = await prisma.clubMembership.findUnique({
        where: { id: membership.id },
      });

      expect(updatedMembership).toBeDefined();
      expect(updatedMembership!.status).toBe(MembershipStatus.REVOKED);
    });

    it('Não deve revogar membership inexistente', async () => {
      // Arrange - ID inexistente
      const nonExistentId = crypto.randomUUID();

      // Act & Assert - Tentar revogar membership inexistente
      await request(app.getHttpServer())
        .post(`/club-management/membership/${nonExistentId}/revoke`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('Não deve revogar membership de outro clube', async () => {
      // Arrange - Criar membership em outro clube
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'Maria',
        lastName: 'Santos',
      });

      const membershipFromAnotherClub = await createTestClubMembership(
        prisma,
        anotherClub.id,
        dependant.id,
        testFamily.familyId,
        MembershipStatus.ACTIVE,
      );

      // Act & Assert - Tentar revogar membership de outro clube
      await request(app.getHttpServer())
        .post(`/club-management/membership/${membershipFromAnotherClub.id}/revoke`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.FORBIDDEN);

      // Assert - Verificar que membership não foi alterada
      const unchangedMembership = await prisma.clubMembership.findUnique({
        where: { id: membershipFromAnotherClub.id },
      });

      expect(unchangedMembership).toBeDefined();
      expect(unchangedMembership!.status).toBe(MembershipStatus.ACTIVE);
    });

    it('Não deve revogar membership já revogada', async () => {
      // Arrange - Criar membership já revogada
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'Pedro',
        lastName: 'Costa',
      });

      const revokedMembership = await createTestClubMembership(prisma, testClub.id, dependant.id, testFamily.familyId, MembershipStatus.REVOKED);

      // Act & Assert - Tentar revogar membership já revogada
      await request(app.getHttpServer())
        .post(`/club-management/membership/${revokedMembership.id}/revoke`)
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.BAD_REQUEST);

      // Assert - Verificar que status permanece revogado
      const unchangedMembership = await prisma.clubMembership.findUnique({
        where: { id: revokedMembership.id },
      });

      expect(unchangedMembership).toBeDefined();
      expect(unchangedMembership!.status).toBe(MembershipStatus.REVOKED);
    });

    it('Não deve permitir acesso sem token de autenticação', async () => {
      // Arrange - Criar membership para teste
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'Ana',
        lastName: 'Oliveira',
      });

      const membership = await createTestClubMembership(prisma, testClub.id, dependant.id, testFamily.familyId, MembershipStatus.ACTIVE);

      // Act & Assert - Tentar revogar sem token
      await request(app.getHttpServer()).post(`/club-management/membership/${membership.id}/revoke`).expect(HttpStatus.UNAUTHORIZED);

      // Assert - Verificar que membership não foi alterada
      const unchangedMembership = await prisma.clubMembership.findUnique({
        where: { id: membership.id },
      });

      expect(unchangedMembership).toBeDefined();
      expect(unchangedMembership!.status).toBe(MembershipStatus.ACTIVE);
    });
  });
});
