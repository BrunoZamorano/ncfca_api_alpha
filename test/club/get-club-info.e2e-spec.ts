import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { PrismaService } from '@/infraestructure/database/prisma.service';

import { setupClubApp, createRegularTestUser, createClubOwnerUser, createTestClub, clubCleanup, ClubTestUser, ClubTestData } from './setup';

describe('(E2E) GetClubInfo', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUser: ClubTestUser;
  let clubOwner: ClubTestUser;
  let testClub: ClubTestData;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupClubApp());

    // Criar usuário regular para fazer as requisições
    testUser = await createRegularTestUser(app, prisma);
    testUsers.push(testUser.userId);

    // Criar usuário dono de clube
    clubOwner = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwner.userId);

    // Criar clube de teste com dados específicos
    testClub = await createTestClub(prisma, clubOwner.userId, {
      name: 'Clube E2E Detalhes Teste',
      city: 'Cidade Detalhes',
      state: 'DT',
      street: 'Rua dos Detalhes',
      number: '789',
      zipCode: '98765432',
      neighborhood: 'Bairro Detalhes',
      complement: 'Andar 2',
      maxMembers: 25,
    });
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await clubCleanup(prisma, testUsers);
    await app.close();
  });

  it('Deve retornar os detalhes de um clube específico', async () => {
    // Arrange - Clube já criado no beforeAll

    // Act - Fazer requisição GET /club/:id usando o ID do clube criado
    const response = await request(app.getHttpServer())
      .get(`/club/${testClub.id}`)
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .expect(HttpStatus.OK);

    // Assert - Verificar se os dados correspondem ao clube criado
    expect(response.body).toMatchObject({
      id: testClub.id,
      name: testClub.name,
      maxMembers: 25,
      address: {
        street: 'Rua dos Detalhes',
        number: '789',
        district: 'Bairro Detalhes',
        city: 'Cidade Detalhes',
        state: 'DT',
        zipCode: '98765432',
        complement: 'Andar 2',
      },
      principalId: clubOwner.userId,
      corum: 0, // Clube sem membros deve ter corum 0
    });

    // Verificar se todos os campos obrigatórios estão presentes
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBeDefined();
    expect(response.body.address).toBeDefined();
    expect(response.body.principalId).toBeDefined();
    expect(response.body.createdAt).toBeDefined();
    expect(typeof response.body.corum).toBe('number');
  });

  it('Não deve retornar um clube se o ID for inválido', async () => {
    // Arrange - Gerar um UUID que não existe no banco de dados
    const invalidClubId = crypto.randomUUID();

    // Act - Fazer requisição GET /club/:id com ID inválido
    const response = await request(app.getHttpServer())
      .get(`/club/${invalidClubId}`)
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .expect(HttpStatus.NOT_FOUND);

    // Assert - Verificar se retornou 404 (já validado pelo expect acima)
    expect(response.body).toBeDefined();
  });
});
