import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';

import { UserRoles } from '@/domain/enums/user-roles';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { AppModule } from '@/app.module';
import { createTestUser } from './utils/prisma/create-test-user';
import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';

describe('AdminController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminUser: { userId: string; familyId: string; accessToken: string };
  let regularUser: { userId: string; familyId: string; accessToken: string };
  let testClubId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // Criar usuário admin e regular
    adminUser = await createTestUser(`admin-${crypto.randomUUID()}@test.com`, [UserRoles.ADMIN], prisma, app);
    regularUser = await createTestUser(`regular-${crypto.randomUUID()}@test.com`, [UserRoles.SEM_FUNCAO], prisma, app);

    // Criar um clube para testar
    const clubData = {
      id: crypto.randomUUID(),
      name: 'Test Club for Admin',
      principal_id: regularUser.userId,
      city: 'Test City',
      state: 'TS',
      number: '123',
      street: 'Test Street',
      zip_code: '12345678',
      neighborhood: 'Test Neighborhood',
    };

    const club = await prisma.club.create({ data: clubData });
    testClubId = club.id;
  });

  describe('/admin/clubs/:clubId (PATCH)', () => {
    it('Deve atualizar um clube com sucesso quando executado por admin', async () => {
      const updateData = {
        name: 'Clube Atualizado pelo Admin',
        maxMembers: 50,
      };

      await request(app.getHttpServer())
        .patch(`/admin/clubs/${testClubId}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.NO_CONTENT);

      // Verificar se o clube foi atualizado
      const updatedClub = await prisma.club.findUnique({ where: { id: testClubId } });
      expect(updatedClub?.name).toBe(updateData.name);
      expect(updatedClub?.max_members).toBe(updateData.maxMembers);
    });

    it('Deve atualizar apenas o nome do clube', async () => {
      const originalClub = await prisma.club.findUnique({ where: { id: testClubId } });
      const originalMaxMembers = originalClub?.max_members;

      const updateData = {
        name: 'Apenas Nome Novo',
      };

      await request(app.getHttpServer())
        .patch(`/admin/clubs/${testClubId}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.NO_CONTENT);

      const updatedClub = await prisma.club.findUnique({ where: { id: testClubId } });
      expect(updatedClub?.name).toBe(updateData.name);
      expect(updatedClub?.max_members).toBe(originalMaxMembers);
    });

    it('Deve atualizar o endereço do clube', async () => {
      const updateData = {
        address: {
          zipCode: '12345678',
          street: 'Rua Nova Atualizada',
          number: '999',
          district: 'Bairro Novo',
          city: 'Cidade Nova',
          state: 'SP',
          complement: 'Complemento Novo',
        },
      };

      await request(app.getHttpServer())
        .patch(`/admin/clubs/${testClubId}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.NO_CONTENT);

      const updatedClub = await prisma.club.findUnique({ where: { id: testClubId } });
      expect(updatedClub?.street).toBe(updateData.address.street);
      expect(updatedClub?.city).toBe(updateData.address.city);
    });

    it('Deve retornar 404 quando clube não existe', async () => {
      const updateData = {
        name: 'Nome para Clube Inexistente',
      };

      await request(app.getHttpServer())
        .patch('/admin/clubs/nonexistent-club-id')
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('Deve retornar 401 quando usuário não está autenticado', async () => {
      const updateData = {
        name: 'Tentativa sem auth',
      };

      await request(app.getHttpServer()).patch(`/admin/clubs/${testClubId}`).send(updateData).expect(HttpStatus.UNAUTHORIZED);
    });

    it('Deve retornar 403 quando usuário não é admin', async () => {
      const updateData = {
        name: 'Tentativa sem permissão',
      };

      await request(app.getHttpServer())
        .patch(`/admin/clubs/${testClubId}`)
        .set('Authorization', `Bearer ${regularUser.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('Deve retornar 400 para dados inválidos', async () => {
      const invalidData = {
        maxMembers: -5, // Valor inválido
      };

      await request(app.getHttpServer())
        .patch(`/admin/clubs/${testClubId}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('Deve retornar 400 para endereço inválido', async () => {
      const invalidData = {
        address: {
          zipCode: '123', // CEP inválido - deve ter 8 caracteres
          street: 'Rua Teste',
          number: '1',
          district: 'Centro',
          city: 'Cidade',
          state: 'SP',
        },
      };

      await request(app.getHttpServer())
        .patch(`/admin/clubs/${testClubId}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
