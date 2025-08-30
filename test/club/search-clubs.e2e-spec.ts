import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Response } from 'supertest';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { PaginatedClubDto } from '@/domain/dtos/paginated-output.dto';
import ClubDto from '@/domain/dtos/club.dto';

import { setupClubApp, createRegularTestUser, createClubOwnerUser, createTestClub, clubCleanup, ClubTestUser, ClubTestData } from './setup';

describe('(E2E) SearchClubs', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let testUser: ClubTestUser;
  let clubOwner1: ClubTestUser;
  let clubOwner2: ClubTestUser;
  let clubOwner3: ClubTestUser;
  let testClub1: ClubTestData;
  let testClub2: ClubTestData;
  let testClub3: ClubTestData;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupClubApp());

    // Criar usuário regular para fazer as requisições
    testUser = await createRegularTestUser(app, prisma);
    testUsers.push(testUser.userId);

    // Criar usuários donos de clube
    clubOwner1 = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwner1.userId);

    clubOwner2 = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwner2.userId);

    clubOwner3 = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwner3.userId);

    // Criar clubes com dados variados para testes
    testClub1 = await createTestClub(prisma, clubOwner1.userId, {
      name: 'Clube de Debate Alpha',
      city: 'São Paulo',
      state: 'SP',
    });

    testClub2 = await createTestClub(prisma, clubOwner2.userId, {
      name: 'Clube de Debate Beta',
      city: 'Rio de Janeiro',
      state: 'RJ',
    });

    testClub3 = await createTestClub(prisma, clubOwner3.userId, {
      name: 'Clube de Oratória Gamma',
      city: 'Brasília',
      state: 'DF',
    });

    // Ensure clubs are created for search functionality testing
    expect(testClub1).toBeDefined();
    expect(testClub2).toBeDefined();
    expect(testClub3).toBeDefined();
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await clubCleanup(prisma, testUsers);
    await app.close();
  });

  it('Deve retornar uma lista paginada de clubes', async () => {
    // Arrange - Dados já preparados no beforeAll

    // Act - Fazer requisição GET /club sem parâmetros
    const response: request.Response = await request(app.getHttpServer())
      .get('/club')
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .expect(HttpStatus.OK);

    // Assert - Validar estrutura da resposta
    const paginatedResponse: PaginatedClubDto = response.body as PaginatedClubDto;
    expect(paginatedResponse).toHaveProperty('data');
    expect(paginatedResponse).toHaveProperty('meta');
    expect(paginatedResponse.data).toBeInstanceOf(Array);
    expect(paginatedResponse.meta).toHaveProperty('total');
    expect(paginatedResponse.meta).toHaveProperty('page');
    expect(paginatedResponse.meta).toHaveProperty('limit');
    expect(paginatedResponse.meta).toHaveProperty('totalPages');
    expect(paginatedResponse.meta.total).toBeGreaterThanOrEqual(3);
  });

  it('Deve filtrar clubes pelo nome', async () => {
    // Arrange - Clube com nome único já criado

    // Act - Fazer requisição GET /club com filtro por nome
    const response: request.Response = await request(app.getHttpServer())
      .get('/club')
      .query({ filter: { name: testClub1.name } })
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .expect(HttpStatus.OK);

    // Assert - Verificar se retornou apenas o clube filtrado
    const paginatedResponse: PaginatedClubDto = response.body as PaginatedClubDto;
    expect(paginatedResponse.meta.total).toBe(1);
    expect(paginatedResponse.data).toHaveLength(1);
    const clubData: ClubDto[] = paginatedResponse.data;
    expect(clubData[0].name).toBe(testClub1.name);
  });

  it('Deve retornar um array vazio se nenhum clube corresponder ao filtro', async () => {
    // Arrange - Garantir que não existe clube com esse nome

    // Act - Fazer requisição GET /club com filtro inexistente
    const response: request.Response = await request(app.getHttpServer())
      .get('/club')
      .query({ filter: { name: 'Inexistente' } })
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .expect(HttpStatus.OK);

    // Assert - Verificar lista vazia
    const paginatedResponse: PaginatedClubDto = response.body as PaginatedClubDto;
    expect(paginatedResponse.meta.total).toBe(0);
    expect(paginatedResponse.data).toBeInstanceOf(Array);
    const clubData: ClubDto[] = paginatedResponse.data;
    expect(clubData).toHaveLength(0);
  });

  it('Deve paginar os resultados corretamente', async () => {
    // Arrange - Verificar quantos clubes existem no total
    const allClubsResponse: request.Response = await request(app.getHttpServer()).get('/club').set('Authorization', `Bearer ${testUser.accessToken}`);

    const allClubsPaginatedResponse: PaginatedClubDto = allClubsResponse.body as PaginatedClubDto;
    const totalClubs = allClubsPaginatedResponse.meta.total;

    // Act - Fazer requisição GET /club com paginação (página 2, limit 2)
    const response: request.Response = await request(app.getHttpServer())
      .get('/club')
      .query({ pagination: { page: 2, limit: 2 } })
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .expect(HttpStatus.OK);

    // Assert - Verificar paginação
    const paginatedResponse: PaginatedClubDto = response.body as PaginatedClubDto;
    expect(paginatedResponse.meta.total).toBe(totalClubs);
    expect(paginatedResponse.meta.page).toBe(2);
    expect(paginatedResponse.meta.limit).toBe(2);
    const clubData: ClubDto[] = paginatedResponse.data;
    expect(clubData).toHaveLength(2); // Página 2 com limit 2 deve ter 2 itens ou menos dependendo do total
  });
});
