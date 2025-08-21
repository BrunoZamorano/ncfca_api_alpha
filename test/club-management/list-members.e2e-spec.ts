import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';

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

describe('(E2E) List Club Members', () => {
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
      name: 'Clube E2E Membros',
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

  describe('GET /club-management/my-club/members', () => {
    it('Deve listar membros ativos do meu clube', async () => {
      // Arrange - Criar dependente e membership ativa
      const dependant = await createTestDependant(prisma, testFamily.familyId, {
        firstName: 'João',
        lastName: 'Silva',
      });

      const membership = await createTestClubMembership(prisma, testClub.id, dependant.id, testFamily.familyId);

      // Act - Listar membros do clube
      const response = await request(app.getHttpServer())
        .get('/club-management/my-club/members')
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Validar dados retornados conforme ClubMemberDto
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: membership.id, // ID da membership, não do dependente
        firstName: 'João',
        lastName: 'Silva',
        email: expect.stringContaining('@testfamily.test'), // Email do holder
        holder: {
          id: testFamily.userId,
          email: expect.stringContaining('@testfamily.test'),
        },
        memberSince: expect.any(String),
        birthDate: expect.any(String),
        sex: expect.any(String),
      });

      // Validar que todos os campos obrigatórios estão presentes
      expect(response.body[0].id).toBeDefined();
      expect(response.body[0].firstName).toBeDefined();
      expect(response.body[0].lastName).toBeDefined();
      expect(response.body[0].holder).toBeDefined();
      expect(response.body[0].holder.id).toBeDefined();
      expect(response.body[0].holder.email).toBeDefined();
      expect(response.body[0].memberSince).toBeDefined();
    });

    it('Deve retornar array vazio quando clube não possui membros', async () => {
      // Arrange - Criar novo clube sem membros para isolamento
      const emptyClubOwner = await createClubOwnerUser(app, prisma);
      testUsers.push(emptyClubOwner.userId);

      const emptyClub = await createTestClub(prisma, emptyClubOwner.userId, {
        name: 'Clube Vazio E2E',
      });

      // Act - Listar membros de clube vazio
      const response = await request(app.getHttpServer())
        .get('/club-management/my-club/members')
        .set('Authorization', `Bearer ${emptyClubOwner.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Validar array vazio
      expect(response.body).toHaveLength(0);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('Não deve permitir listar membros de clube de outro usuário', async () => {
      // Arrange - anotherClubOwner tem seu próprio clube, retornará membros do seu clube
      // Como cada usuário só vê os membros do próprio clube, isso não é um problema de segurança
      // O endpoint sempre retorna os membros do clube do usuário logado

      // Act - Listar membros com outro token (verá seu próprio clube vazio)
      const response = await request(app.getHttpServer())
        .get('/club-management/my-club/members')
        .set('Authorization', `Bearer ${anotherClubOwner.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Deve retornar array vazio pois outro clube não tem membros
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
