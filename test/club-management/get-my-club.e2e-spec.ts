import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { PrismaService } from '@/infraestructure/database/prisma.service';

import { setupClubManagementApp, createClubOwnerUser, createTestClub, clubManagementCleanup, ClubManagementTestUser, ClubTestData } from './setup';

describe('(E2E) GetMyClub', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clubOwner: ClubManagementTestUser;
  let clubOwnerWithoutClub: ClubManagementTestUser;
  let testClub: ClubTestData;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupClubManagementApp());

    // Criar usuário dono do clube
    clubOwner = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwner.userId);

    // Criar segundo usuário dono sem clube
    clubOwnerWithoutClub = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwnerWithoutClub.userId);

    // Criar clube para o dono principal
    testClub = await createTestClub(prisma, clubOwner.userId, {
      name: 'Clube E2E Teste',
      maxMembers: 30,
      street: 'Rua dos Testes',
      number: '456',
      city: 'Cidade E2E',
      state: 'TS', // Estado específico para teste
      zipCode: '87654321',
      neighborhood: 'Bairro Teste',
      complement: 'Sala 101',
    });
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await clubManagementCleanup(prisma, testUsers);
    await app.close();
  });

  describe('GET /club-management/my-club', () => {
    it('Deve retornar as informações completas do clube para o dono autenticado', async () => {
      // Arrange - Dados já preparados no beforeAll

      // Act - Buscar informações do clube
      const response = await request(app.getHttpServer())
        .get('/club-management/my-club')
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .expect(HttpStatus.OK);

      // Assert - Validar dados retornados conforme ClubDto
      expect(response.body).toMatchObject({
        id: testClub.id,
        name: testClub.name,
        maxMembers: 30,
        address: {
          street: 'Rua dos Testes',
          number: '456',
          district: 'Bairro Teste',
          city: 'Cidade E2E',
          state: 'TS',
          zipCode: '87654321',
          complement: 'Sala 101',
        },
        principalId: clubOwner.userId,
        corum: 0, // Clube sem membros deve ter corum 0
      });

      // Validar que todos os campos obrigatórios estão presentes
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBeDefined();
      expect(response.body.address).toBeDefined();
      expect(response.body.principalId).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(typeof response.body.corum).toBe('number');
    });

    it('Não deve retornar clube quando usuário dono não possui clube', async () => {
      // Arrange - Usuário sem clube já criado

      // Act & Assert - Tentar buscar clube inexistente
      await request(app.getHttpServer())
        .get('/club-management/my-club')
        .set('Authorization', `Bearer ${clubOwnerWithoutClub.accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('Não deve permitir acesso sem token de autenticação', async () => {
      // Arrange - Nenhuma preparação especial

      // Act & Assert - Tentar acessar sem token
      await request(app.getHttpServer()).get('/club-management/my-club').expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
