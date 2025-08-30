import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '@/infraestructure/database/prisma.service';

import { setupClubManagementApp, createClubOwnerUser, createTestClub, clubManagementCleanup, ClubManagementTestUser, ClubTestData } from './setup';

describe('(E2E) UpdateClubInfo', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let clubOwner: ClubManagementTestUser;
  let otherClubOwner: ClubManagementTestUser;
  let testClub: ClubTestData;
  let otherClub: ClubTestData;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupClubManagementApp());

    // Criar usuário dono do clube principal
    clubOwner = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwner.userId);

    // Criar outro usuário dono para teste de autorização
    otherClubOwner = await createClubOwnerUser(app, prisma);
    testUsers.push(otherClubOwner.userId);

    // Criar clube para o dono principal
    testClub = await createTestClub(prisma, clubOwner.userId, {
      name: 'Clube Original',
      maxMembers: 25,
      street: 'Rua Original',
      number: '100',
      city: 'Cidade Original',
      state: 'OR',
      zipCode: '12345678',
      neighborhood: 'Bairro Original',
    });

    // Criar clube para o outro dono
    otherClub = await createTestClub(prisma, otherClubOwner.userId, {
      name: 'Outro Clube',
      maxMembers: 40,
    });
  });

  afterAll(async () => {
    // Cleanup cirúrgico dos dados de teste
    await clubManagementCleanup(prisma, testUsers);
    await app.close();
  });

  describe('PATCH /club-management', () => {
    it('Deve atualizar nome e endereço do clube com sucesso para o dono autenticado', async () => {
      // Arrange - Dados de atualização
      const updateData = {
        name: 'Clube Atualizado E2E',
        address: {
          street: 'Rua Nova',
          number: '999',
          district: 'Bairro Novo',
          city: 'Cidade Nova',
          state: 'NV',
          zipCode: '87654321',
          complement: 'Andar 2',
        },
      };

      // Act - Atualizar clube
      await request(app.getHttpServer())
        .patch('/club-management')
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.NO_CONTENT);

      // Assert - Verificar atualização no banco via Prisma
      const updatedClub = await prisma.club.findUnique({
        where: { id: testClub.id },
      });

      expect(updatedClub).not.toBeNull();
      expect(updatedClub?.name).toBe('Clube Atualizado E2E');
      expect(updatedClub?.street).toBe('Rua Nova');
      expect(updatedClub?.number).toBe('999');
      expect(updatedClub?.neighborhood).toBe('Bairro Novo');
      expect(updatedClub?.city).toBe('Cidade Nova');
      expect(updatedClub?.state).toBe('NV');
      expect(updatedClub?.zip_code).toBe('87654321');
      expect(updatedClub?.complement).toBe('Andar 2');
    });

    it('Deve atualizar apenas maxMembers quando fornecido isoladamente', async () => {
      // Arrange - Atualizar apenas maxMembers
      const updateData = {
        maxMembers: 50,
      };

      // Act - Atualizar clube
      await request(app.getHttpServer())
        .patch('/club-management')
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.NO_CONTENT);

      // Assert - Verificar atualização no banco
      const updatedClub = await prisma.club.findUnique({
        where: { id: testClub.id },
      });

      expect(updatedClub?.max_members).toBe(50);
      // Verificar que outros campos não foram alterados
      expect(updatedClub?.name).toBe('Clube Atualizado E2E'); // Do teste anterior
    });

    it('Deve aceitar maxMembers igual a 1 (sem validação mínima)', async () => {
      // Arrange - Dados com maxMembers = 1
      const updateData = {
        maxMembers: 1,
      };

      // Act - Atualizar clube
      await request(app.getHttpServer())
        .patch('/club-management')
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.NO_CONTENT);

      // Assert - Verificar atualização no banco
      const updatedClub = await prisma.club.findUnique({
        where: { id: testClub.id },
      });

      expect(updatedClub?.max_members).toBe(1);
    });

    it('Não deve aceitar address com campos extras não permitidos', async () => {
      // Arrange - Dados com campos extras não permitidos
      const invalidData = {
        address: {
          street: 'Rua Válida',
          number: '123',
          district: 'Bairro Válido',
          city: 'Cidade Válida',
          state: 'CV',
          zipCode: '12345678',
          extraField: 'campo não permitido', // Campo não permitido pelo whitelist
        },
      };

      // Act & Assert - Validação deve falhar devido ao whitelist
      await request(app.getHttpServer())
        .patch('/club-management')
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('Não deve permitir atualização por usuário que tem outro clube', async () => {
      // Arrange - Dados válidos, mas usuário tem seu próprio clube diferente
      const updateData = {
        name: 'Tentativa de Alteração',
      };

      // Act - Usuário atualiza SEU PRÓPRIO clube (não o clube do teste)
      await request(app.getHttpServer())
        .patch('/club-management')
        .set('Authorization', `Bearer ${otherClubOwner.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.NO_CONTENT);

      // Assert - Verificar que APENAS o clube do otherClubOwner foi alterado
      const otherClubUpdated = await prisma.club.findUnique({
        where: { id: otherClub.id },
      });

      const mainClubNotChanged = await prisma.club.findUnique({
        where: { id: testClub.id },
      });

      expect(otherClubUpdated?.name).toBe('Tentativa de Alteração');
      expect(mainClubNotChanged?.name).toBe('Clube Atualizado E2E'); // Não deve ter mudado
    });

    it('Não deve permitir acesso sem token de autenticação', async () => {
      // Arrange - Dados válidos mas sem token
      const updateData = {
        name: 'Tentativa sem token',
      };

      // Act & Assert - Deve retornar 401 Unauthorized
      await request(app.getHttpServer()).patch('/club-management').send(updateData).expect(HttpStatus.UNAUTHORIZED);
    });

    it('Não deve aceitar name muito curto', async () => {
      // Arrange - Nome com menos de 3 caracteres
      const invalidData = {
        name: 'AB', // Menor que minLength de 3
      };

      // Act & Assert - Validação deve falhar
      await request(app.getHttpServer())
        .patch('/club-management')
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('Não deve aceitar address com zipCode inválido', async () => {
      // Arrange - Address com zipCode inválido
      const invalidData = {
        address: {
          street: 'Rua Válida',
          number: '123',
          district: 'Bairro Válido',
          city: 'Cidade Válida',
          state: 'CV',
          zipCode: '1234567', // 7 dígitos ao invés de 8
        },
      };

      // Act & Assert - Validação deve falhar
      await request(app.getHttpServer())
        .patch('/club-management')
        .set('Authorization', `Bearer ${clubOwner.accessToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
