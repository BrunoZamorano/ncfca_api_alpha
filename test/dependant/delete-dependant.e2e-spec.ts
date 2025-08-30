import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { FamilyStatus } from '@/domain/enums/family-status';

import { setupDependantApp, createRegularUser, createTestDependant, createIsolatedFamily, dependantCleanup, DependantTestUser } from './setup';
import DependantDto from '@/domain/dtos/dependant.dto';

describe('(E2E) DELETE /dependants/:id - Remoção de Dependentes', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let affiliatedUser: DependantTestUser;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Arrange - Setup da aplicação e usuários base
    ({ app, prisma } = await setupDependantApp());

    // Criar usuário regular com família afiliada
    affiliatedUser = await createRegularUser(app, prisma, FamilyStatus.AFFILIATED);
    testUsers.push(affiliatedUser.userId);
  });

  afterAll(async () => {
    // Cleanup cirúrgico
    await dependantCleanup(prisma, testUsers);
    await app.close();
  });

  describe('DELETE /dependants/:id', () => {
    it('deve remover um dependente com sucesso (status 204)', async () => {
      // Arrange - Criar um dependente para remover
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'DependenteParaRemover',
        lastName: 'Teste',
      });

      // Act - Fazer requisição DELETE
      const response = (await request(app.getHttpServer())
        .delete(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .expect(HttpStatus.NO_CONTENT)) as { status: number; body: Record<string, never> };

      // Assert - Verificar se a resposta está correta
      expect(response.body).toEqual({});
    });

    it('deve retornar erro 404 se o dependente não existir', async () => {
      // Arrange - ID fictício de dependente que não existe
      const nonExistentId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

      // Act & Assert - Tentar deletar dependente inexistente
      await request(app.getHttpServer())
        .delete(`/dependants/${nonExistentId}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('deve retornar erro 404 se o dependente pertencer a outra família', async () => {
      // Arrange - Criar uma família isolada com dependente
      const isolatedFamily = await createIsolatedFamily(app, prisma);
      const isolatedUser = isolatedFamily.user;
      const isolatedDependant = isolatedFamily.dependant as { id: string };
      testUsers.push(isolatedUser.userId);

      // Act & Assert - Tentar deletar dependente de outra família (retorna 404 por não pertencer à família do usuário)
      await request(app.getHttpServer())
        .delete(`/dependants/${isolatedDependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('após a remoção, deve verificar se o dependente não é mais retornado na listagem', async () => {
      // Arrange - Criar um dependente para remover e verificar
      const dependant = await createTestDependant(prisma, affiliatedUser.familyId, {
        firstName: 'DependenteParaVerificarRemocao',
        lastName: 'Teste',
      });

      // Verificar que o dependente existe antes da remoção
      const listBeforeDelete = (await request(app.getHttpServer())
        .get('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .expect(HttpStatus.OK)) as { status: number; body: DependantDto[] };

      const dependantExistsBefore = listBeforeDelete.body.some((dep) => dep.id === dependant.id);
      expect(dependantExistsBefore).toBe(true);

      // Act - Remover o dependente
      await request(app.getHttpServer())
        .delete(`/dependants/${dependant.id}`)
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Assert - Verificar que o dependente não aparece mais na listagem
      const listAfterDelete = (await request(app.getHttpServer())
        .get('/dependants')
        .set('Authorization', `Bearer ${affiliatedUser.accessToken}`)
        .expect(HttpStatus.OK)) as { status: number; body: DependantDto[] };

      const dependantExistsAfter = listAfterDelete.body.some((dep) => dep.id === dependant.id);
      expect(dependantExistsAfter).toBe(false);
    });
  });
});
