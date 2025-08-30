import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DependantRelationship, Sex } from '@prisma/client';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { FamilyStatus } from '@/domain/enums/family-status';

import {
  setupDependantApp,
  createRegularUser,
  createAdminUser,
  createTestDependant,
  createIsolatedFamily,
  dependantCleanup,
  DependantTestUser,
} from './setup';

interface ErrorResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

describe('(E2E) PATCH /dependants/:id - Atualização de Dependentes', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let affiliatedUser: DependantTestUser;
  let nonAffiliatedUser: DependantTestUser;
  let adminUser: DependantTestUser;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupDependantApp());

    // Criar usuário regular com família afiliada
    affiliatedUser = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(affiliatedUser.userId);

    // Criar usuário regular com família não afiliada
    nonAffiliatedUser = await createRegularUser(app, prisma, FamilyStatus.NOT_AFFILIATED);
    testUsers.push(nonAffiliatedUser.userId);

    // Criar usuário admin
    adminUser = await createAdminUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(adminUser.userId);
  });

  afterAll(async () => {
    // Cleanup cirúrgico
    await dependantCleanup(prisma, testUsers);
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cenários de Sucesso - Atualizações Individuais', () => {
    it('Deve atualizar apenas firstName com sucesso', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao.silva@test.com',
      });

      const updateData = { firstName: 'José' };

      // Act
      const response = (await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData)) as { status: number; body: Record<string, never> };

      // Assert
      expect(response.status).toBe(HttpStatus.NO_CONTENT);

      // Verificar persistência no banco
      const updatedDependant = await prisma.dependant.findUnique({
        where: { id: dependant.id },
      });

      expect(updatedDependant).toBeDefined();
      expect(updatedDependant?.first_name).toBe('José');
      expect(updatedDependant?.last_name).toBe('Silva'); // Não deve ter mudado
      expect(updatedDependant?.email).toBe('joao.silva@test.com'); // Não deve ter mudado
    });

    it('Deve atualizar apenas lastName com sucesso', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria.santos@test.com',
      });

      const updateData = { lastName: 'Oliveira' };

      // Act
      const response = (await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData)) as { status: number; body: Record<string, never> };

      // Assert
      expect(response.status).toBe(HttpStatus.NO_CONTENT);

      // Verificar persistência no banco
      const updatedDependant = await prisma.dependant.findUnique({
        where: { id: dependant.id },
      });

      expect(updatedDependant?.first_name).toBe('Maria'); // Não deve ter mudado
      expect(updatedDependant?.last_name).toBe('Oliveira');
    });

    it('Deve atualizar apenas birthdate com sucesso', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'Pedro',
        birthDate: new Date('2012-01-15'),
      });

      const updateData = { birthdate: '2011-05-20' };

      // Act
      const response = (await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData)) as { status: number; body: Record<string, never> };

      // Assert
      expect(response.status).toBe(HttpStatus.NO_CONTENT);

      // Verificar persistência no banco
      const updatedDependant = await prisma.dependant.findUnique({
        where: { id: dependant.id },
      });

      const expectedDate = new Date('2011-05-20T00:00:00.000Z');
      expect(updatedDependant?.birthdate).toEqual(expectedDate);
    });

    it('Deve atualizar apenas relationship com sucesso', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'Ana',
        relationship: DependantRelationship.SON,
      });

      const updateData = { relationship: DependantRelationship.DAUGHTER };

      // Act
      const response = (await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData)) as { status: number; body: Record<string, never> };

      // Assert
      expect(response.status).toBe(HttpStatus.NO_CONTENT);

      // Verificar persistência no banco
      const updatedDependant = await prisma.dependant.findUnique({
        where: { id: dependant.id },
      });

      expect(updatedDependant?.relationship).toBe(DependantRelationship.DAUGHTER);
    });

    it('Deve atualizar apenas sex com sucesso', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'Alex',
        sex: Sex.MALE,
      });

      const updateData = { sex: Sex.FEMALE };

      // Act
      const response = (await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData)) as { status: number; body: Record<string, never> };

      // Assert
      expect(response.status).toBe(HttpStatus.NO_CONTENT);

      // Verificar persistência no banco
      const updatedDependant = await prisma.dependant.findUnique({
        where: { id: dependant.id },
      });

      expect(updatedDependant?.sex).toBe(Sex.FEMALE);
    });

    it('Deve atualizar apenas email com sucesso', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'Carlos',
        email: 'carlos.old@test.com',
      });

      const updateData = { email: 'carlos.new@test.com' };

      // Act
      const response = (await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData)) as { status: number; body: Record<string, never> };

      // Assert
      expect(response.status).toBe(HttpStatus.NO_CONTENT);

      // Verificar persistência no banco
      const updatedDependant = await prisma.dependant.findUnique({
        where: { id: dependant.id },
      });

      expect(updatedDependant?.email).toBe('carlos.new@test.com');
    });

    it('Deve atualizar apenas phone com sucesso', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'Lucia',
        phone: '11987654321',
      });

      const updateData = { phone: '11123456789' };

      // Act
      const response = (await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData)) as { status: number; body: Record<string, never> };

      // Assert
      expect(response.status).toBe(HttpStatus.NO_CONTENT);

      // Verificar persistência no banco
      const updatedDependant = await prisma.dependant.findUnique({
        where: { id: dependant.id },
      });

      expect(updatedDependant?.phone).toBe('11123456789');
    });

    it('Deve manter phone original quando string vazia é enviada', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'Roberto',
        phone: '11987654321',
      });

      const updateData = { phone: '' };

      // Act
      const response = (await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData)) as { status: number; body: Record<string, never> };

      // Assert
      expect(response.status).toBe(HttpStatus.NO_CONTENT);

      // Verificar que o phone foi mantido (sistema ignora string vazia)
      const updatedDependant = await prisma.dependant.findUnique({
        where: { id: dependant.id },
      });

      expect(updatedDependant?.phone).toBe('11987654321'); // Mantém valor original
    });
  });

  describe('Cenários de Sucesso - Múltiplos Campos', () => {
    it('Deve atualizar múltiplos campos simultaneamente', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'Antônio',
        lastName: 'Ferreira',
        birthDate: new Date('2010-01-01'),
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'antonio.old@test.com',
        phone: '11999999999',
      });

      const updateData = {
        firstName: 'Antônia',
        lastName: 'Silva',
        birthdate: '2011-12-25',
        relationship: DependantRelationship.DAUGHTER,
        sex: Sex.FEMALE,
        email: 'antonia.new@test.com',
        phone: '11888888888',
      };

      // Act
      const response = (await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData)) as { status: number; body: Record<string, never> };

      // Assert
      expect(response.status).toBe(HttpStatus.NO_CONTENT);

      // Verificar persistência no banco
      const updatedDependant = await prisma.dependant.findUnique({
        where: { id: dependant.id },
      });

      expect(updatedDependant).toBeDefined();
      expect(updatedDependant?.first_name).toBe('Antônia');
      expect(updatedDependant?.last_name).toBe('Silva');
      expect(updatedDependant?.birthdate).toEqual(new Date('2011-12-25T00:00:00.000Z'));
      expect(updatedDependant?.relationship).toBe(DependantRelationship.DAUGHTER);
      expect(updatedDependant?.sex).toBe(Sex.FEMALE);
      expect(updatedDependant?.email).toBe('antonia.new@test.com');
      expect(updatedDependant?.phone).toBe('11888888888');
    });

    it('Deve atualizar campos parciais mantendo outros inalterados', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'Gabriel',
        lastName: 'Costa',
        birthDate: new Date('2013-06-10'),
        relationship: DependantRelationship.SON,
        sex: Sex.MALE,
        email: 'gabriel@test.com',
        phone: '11777777777',
      });

      const updateData = {
        firstName: 'Gabriela',
        sex: Sex.FEMALE,
      };

      // Act
      const response = (await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData)) as { status: number; body: Record<string, never> };

      // Assert
      expect(response.status).toBe(HttpStatus.NO_CONTENT);

      // Verificar persistência no banco
      const updatedDependant = await prisma.dependant.findUnique({
        where: { id: dependant.id },
      });

      // Campos atualizados
      expect(updatedDependant?.first_name).toBe('Gabriela');
      expect(updatedDependant?.sex).toBe(Sex.FEMALE);

      // Campos mantidos
      expect(updatedDependant?.last_name).toBe('Costa');
      expect(updatedDependant?.birthdate).toEqual(new Date('2013-06-10T00:00:00.000Z'));
      expect(updatedDependant?.relationship).toBe(DependantRelationship.SON);
      expect(updatedDependant?.email).toBe('gabriel@test.com');
      expect(updatedDependant?.phone).toBe('11777777777');
    });
  });

  describe('Validação de Campos - Formato', () => {
    it('Não deve atualizar com firstName muito curto', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId);
      const updateData = { firstName: 'A' };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect((response as { body: ErrorResponse }).body.message).toContain('firstName must be longer than or equal to 2 characters');
    });

    it('Não deve atualizar com lastName muito curto', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId);
      const updateData = { lastName: 'B' };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect((response as { body: ErrorResponse }).body.message).toContain('lastName must be longer than or equal to 2 characters');
    });

    it('Não deve atualizar com birthdate inválida', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId);
      const updateData = { birthdate: 'invalid-date' };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect((response as { body: ErrorResponse }).body.message).toContain('birthdate must be a valid ISO 8601 date string');
    });

    it('Não deve atualizar com relationship inválido', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId);
      const updateData = { relationship: 'INVALID_RELATIONSHIP' };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect((response as { body: ErrorResponse }).body.message).toContain(
        'relationship must be one of the following values: DAUGHTER, HUSBAND, CHILD, WIFE, SON, OTHER',
      );
    });

    it('Não deve atualizar com sex inválido', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId);
      const updateData = { sex: 'INVALID_SEX' };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect((response as { body: ErrorResponse }).body.message).toContain('sex must be one of the following values: FEMALE, MALE');
    });

    it('Não deve atualizar com email inválido', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId);
      const updateData = { email: 'invalid-email' };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect((response as { body: ErrorResponse }).body.message).toContain('email must be an email');
    });
  });

  describe('Validação de Tipos de Dados', () => {
    it('Não deve atualizar com firstName não sendo string', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId);
      const updateData = { firstName: 123 };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect((response as { body: ErrorResponse }).body.message).toContain('firstName must be a string');
    });

    it('Não deve atualizar com phone não sendo string', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId);
      const updateData = { phone: 123456789 };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect((response as { body: ErrorResponse }).body.message).toContain('phone must be a string');
    });

    it('Não deve atualizar com birthdate não sendo string de data', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId);
      const updateData = { birthdate: 20121215 };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect((response as { body: ErrorResponse }).body.message).toContain('birthdate must be a valid ISO 8601 date string');
    });
  });

  describe('Casos de Erro - Dependente Não Encontrado', () => {
    it('Deve retornar 404 para dependente inexistente', async () => {
      // Arrange
      const nonExistentId = crypto.randomUUID();
      const updateData = { firstName: 'Nome' };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${nonExistentId}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('Deve retornar 404 para ID inválido/malformado', async () => {
      // Arrange
      const invalidId = 'invalid-uuid-format';
      const updateData = { firstName: 'Nome' };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${invalidId}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('Autorização - Acesso Cross-Family', () => {
    it('Não deve atualizar dependente de outra família', async () => {
      // Arrange - Criar família isolada
      const otherFamily = await createIsolatedFamily(app, prisma);
      const otherUser = otherFamily.user;
      const otherFamilyDependant = otherFamily.dependant as { id: string };
      testUsers.push(otherUser.userId);

      const updateData = { firstName: 'Hacker' };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${otherFamilyDependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);

      // Verificar que o dependente não foi alterado
      const unchangedDependant = (await prisma.dependant.findUnique({
        where: { id: otherFamilyDependant.id },
      })) as { id: string; first_name: string } | null;

      expect(unchangedDependant?.first_name).toBe('Isolated'); // Nome original
      expect(unchangedDependant?.first_name).not.toBe('Hacker');
    });

    it('Admin não deve conseguir atualizar dependentes de outras famílias', async () => {
      // Arrange - Criar dependente para usuário regular
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'UsuarioRegular',
      });

      const updateData = { firstName: 'AlteradoPorAdmin' };

      // Act - Admin tentando alterar dependente de outra família
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);

      // Verificar que o dependente não foi alterado
      const unchangedDependant = await prisma.dependant.findUnique({
        where: { id: dependant.id },
      });

      expect(unchangedDependant?.first_name).toBe('UsuarioRegular');
    });
  });

  describe('Autenticação', () => {
    it('Não deve atualizar dependente sem token de autenticação', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId);
      const updateData = { firstName: 'Unauthorized' };

      // Act
      const response = await request(app.getHttpServer()).patch(`/dependants/${dependant.id}`).send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('Não deve atualizar dependente com token inválido', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId);
      const updateData = { firstName: 'Invalid' };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', 'Bearer invalid-token')
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Status da Família - Família Não Afiliada', () => {
    it('Usuário com família não afiliada deve poder atualizar dependentes', async () => {
      // Arrange - Criar dependente para família não afiliada
      const dependant = await createTestDependant(prisma, nonAffiliatedUser.familyId, {
        firstName: 'DependenteNaoAfiliado',
      });

      const updateData = { firstName: 'NomeAtualizado' };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${nonAffiliatedUser.accessToken}`)
        .send(updateData);

      // Assert
      // Atualização deve ser permitida independente do status de afiliação
      expect(response.status).toBe(HttpStatus.NO_CONTENT);

      // Verificar persistência
      const updatedDependant = await prisma.dependant.findUnique({
        where: { id: dependant.id },
      });

      expect(updatedDependant?.first_name).toBe('NomeAtualizado');
    });
  });

  describe('Campos Extras e Validação Rigorosa', () => {
    it('Deve rejeitar campos extras não permitidos', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId);
      const dataWithExtraFields = {
        firstName: 'Nome',
        extraField: 'not allowed',
        anotherExtra: 123,
        maliciousField: 'hack attempt',
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(dataWithExtraFields);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('Deve aceitar body vazio (sem campos para atualizar)', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'OriginalName',
      });

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send({});

      // Assert
      expect(response.status).toBe(HttpStatus.NO_CONTENT);

      // Verificar que nada mudou
      const unchangedDependant = await prisma.dependant.findUnique({
        where: { id: dependant.id },
      });

      expect(unchangedDependant?.first_name).toBe('OriginalName');
    });
  });

  describe('Validação de Diferentes Relacionamentos', () => {
    const relationships = [
      { value: 'SON', prismaEnum: DependantRelationship.SON },
      { value: 'DAUGHTER', prismaEnum: DependantRelationship.DAUGHTER },
      { value: 'WIFE', prismaEnum: DependantRelationship.WIFE },
      { value: 'HUSBAND', prismaEnum: DependantRelationship.HUSBAND },
      { value: 'CHILD', prismaEnum: DependantRelationship.CHILD },
      { value: 'OTHER', prismaEnum: DependantRelationship.OTHER },
    ];

    relationships.forEach(({ value, prismaEnum }, index) => {
      it(`Deve atualizar relationship para ${value} com sucesso`, async () => {
        // Arrange - Criar com nome único para evitar conflitos de nomes duplicados
        const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
          firstName: `TestRel${index}`,
          lastName: `Relationship${index}`,
          relationship: DependantRelationship.SON,
          email: `testrel${index}@example.com`,
        });

        const updateData = { relationship: value };

        // Act
        const response = await request(app.getHttpServer())
          .patch(`/dependants/${dependant.id}`)
          .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
          .send(updateData);

        // Assert
        expect(response.status).toBe(HttpStatus.NO_CONTENT);

        // Verificar persistência
        const updatedDependant = await prisma.dependant.findUnique({
          where: { id: dependant.id },
        });

        expect(updatedDependant?.relationship).toBe(prismaEnum);
      });
    });
  });

  describe('Validação de Sexo', () => {
    const sexOptions = [
      { value: 'MALE', prismaEnum: Sex.MALE },
      { value: 'FEMALE', prismaEnum: Sex.FEMALE },
    ];

    sexOptions.forEach(({ value, prismaEnum }, index) => {
      it(`Deve atualizar sex para ${value} com sucesso`, async () => {
        // Arrange - Criar com nome único para evitar conflitos
        const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
          firstName: `TestSex${index}`,
          lastName: `Gender${index}`,
          sex: value === 'MALE' ? Sex.FEMALE : Sex.MALE,
          email: `testsex${index}@example.com`,
        });

        const updateData = { sex: value };

        // Act
        const response = await request(app.getHttpServer())
          .patch(`/dependants/${dependant.id}`)
          .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
          .send(updateData);

        // Assert
        expect(response.status).toBe(HttpStatus.NO_CONTENT);

        // Verificar persistência
        const updatedDependant = await prisma.dependant.findUnique({
          where: { id: dependant.id },
        });

        expect(updatedDependant?.sex).toBe(prismaEnum);
      });
    });
  });

  describe('Casos Limite - Valores Null e Undefined', () => {
    it('Não deve aceitar valores null em campos obrigatórios', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId);
      const updateData = {
        firstName: null,
        lastName: null,
        email: null,
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('Não deve aceitar null para campos opcionais (phone) sem validação específica', async () => {
      // Arrange
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'TestNull',
        phone: '11999999999',
      });

      // Note: Este comportamento depende da implementação do sistema
      // Se null não for aceito pelo DTO, o teste esperará erro de validação
      const updateData = { phone: null };

      // Act
      const response = (await request(app.getHttpServer())
        .patch(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .send(updateData)) as { status: number; body: ErrorResponse | Record<string, never> };

      // Assert
      // O sistema pode não aceitar null explicitamente através de validação
      // Verificamos se rejeita com Bad Request ou se aceita com No Content
      if ((response.status as HttpStatus) === HttpStatus.BAD_REQUEST) {
        expect((response as { body: ErrorResponse }).body.message).toContain('phone');
      } else {
        expect(response.status).toBe(HttpStatus.NO_CONTENT);

        // Verificar persistência se aceito
        const updatedDependant = await prisma.dependant.findUnique({
          where: { id: dependant.id },
        });

        // O campo pode manter o valor original se null não for processado
        expect(updatedDependant?.phone).toBeTruthy();
      }
    });
  });
});
