import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { PrismaService } from '@/infraestructure/database/prisma.service';

import { setupClubApp, createRegularTestUser, createClubOwnerUser, createTestClub, clubCleanup, ClubTestUser, ClubTestData } from './setup';

describe('(E2E) SearchClubs', () => {
  let app: INestApplication;
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
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await clubCleanup(prisma, testUsers);
    await app.close();
  });

  it('Deve retornar uma lista paginada de clubes', async () => {
    // Arrange - Dados já preparados no beforeAll

    // Act - Fazer requisição GET /club sem parâmetros
    const response = await request(app.getHttpServer()).get('/club').set('Authorization', `Bearer ${testUser.accessToken}`).expect(HttpStatus.OK);

    // Assert - Validar estrutura da resposta
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('totalPages');
    expect(response.body.meta.total).toBeGreaterThanOrEqual(3);
  });

  it('Deve filtrar clubes pelo nome', async () => {
    // Arrange - Clube com nome único já criado

    // Act - Fazer requisição GET /club com filtro por nome
    const response = await request(app.getHttpServer())
      .get('/club')
      .query({ filter: { name: testClub1.name } })
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .expect(HttpStatus.OK);

    // Assert - Verificar se retornou apenas o clube filtrado
    expect(response.body.meta.total).toBe(1);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe(testClub1.name);
  });

  it('Deve retornar um array vazio se nenhum clube corresponder ao filtro', async () => {
    // Arrange - Garantir que não existe clube com esse nome

    // Act - Fazer requisição GET /club com filtro inexistente
    const response = await request(app.getHttpServer())
      .get('/club')
      .query({ filter: { name: 'Inexistente' } })
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .expect(HttpStatus.OK);

    // Assert - Verificar lista vazia
    expect(response.body.meta.total).toBe(0);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data).toHaveLength(0);
  });

  it('Deve paginar os resultados corretamente', async () => {
    // Arrange - Verificar quantos clubes existem no total
    const allClubsResponse = await request(app.getHttpServer()).get('/club').set('Authorization', `Bearer ${testUser.accessToken}`);

    const totalClubs = allClubsResponse.body.meta.total;

    // Act - Fazer requisição GET /club com paginação (página 2, limit 2)
    const response = await request(app.getHttpServer())
      .get('/club')
      .query({ pagination: { page: 2, limit: 2 } })
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .expect(HttpStatus.OK);

    // Assert - Verificar paginação
    expect(response.body.meta.total).toBe(totalClubs);
    expect(response.body.meta.page).toBe(2);
    expect(response.body.meta.limit).toBe(2);
    expect(response.body.data).toHaveLength(2); // Página 2 com limit 2 deve ter 2 itens ou menos dependendo do total
  });
});
