# Testes E2E - Club Controller

Este diretório contém a infraestrutura e testes E2E para o módulo Club Controller.

## Estrutura

- `setup.ts` - Funções de setup e utilitários comuns para todos os testes
- Futuros arquivos de teste seguirão o padrão: `nome-da-funcionalidade.e2e-spec.ts`

## Rotas Cobertas pelo Club Controller

O controller possui as seguintes rotas que serão testadas:

### Busca de Clubes
- `GET /club` - Lista clubes com paginação e filtros opcionais (nome, cidade, estado)

### Informações do Clube
- `GET /club/:id` - Obtém informações detalhadas de um clube específico

## Como Usar o Setup

### 1. Importar o Setup
```typescript
import {
  setupClubApp,
  createRegularTestUser,
  createClubOwnerUser,
  createTestClub,
  clubCleanup,
  ClubTestUser,
  ClubTestData
} from './setup';
```

### 2. Configurar o Teste
```typescript
describe('(E2E) BuscaDeClube', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUser: ClubTestUser;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Setup da aplicação
    ({ app, prisma } = await setupClubApp());
    
    // Criar usuário para os testes
    testUser = await createRegularTestUser(app, prisma);
    testUsers.push(testUser.userId);
    
    // Criar dados de teste se necessário
    const clubOwner = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwner.userId);
    await createTestClub(prisma, clubOwner.userId, { name: 'Clube Teste' });
  });

  afterAll(async () => {
    // Cleanup cirúrgico
    await clubCleanup(prisma, testUsers);
    await app.close();
  });
});
```

### 3. Funções Disponíveis

#### Usuários
- `createRegularTestUser(app, prisma, roles?, familyStatus?)` - Cria usuário genérico para teste
- `createClubOwnerUser(app, prisma, familyStatus?)` - Cria usuário com role DONO_DE_CLUBE

#### Entidades de Teste
- `createTestClub(prisma, principalId, overrides?)` - Cria um clube para testes

#### Cleanup
- `clubCleanup(prisma, userIds)` - Remove todos os dados relacionados aos usuários de teste

## Padrões a Seguir

### 1. Nomenclatura
- Describe: `(E2E) NomeDaFuncionalidade`
- Tests: `Deve ...` ou `Não deve ...`

### 2. Estrutura AAA
```typescript
it('Deve buscar clubes com sucesso', async () => {
  // Arrange - Preparar dados
  const query = { page: 1, limit: 10 };
  
  // Act - Executar ação
  const response = await request(app.getHttpServer())
    .get('/club')
    .set('Authorization', `Bearer ${testUser.accessToken}`)
    .query(query);
  
  // Assert - Verificar resultado
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('total');
});
```

### 3. Cleanup Cirúrgico
- Sempre usar `afterAll` para cleanup
- Sempre rastrear `testUsers` criados
- Nunca fazer cleanup global (TRUNCATE)

### 4. Independência dos Testes
- Cada teste deve ser independente
- Não reutilizar dados entre testes
- Criar dados específicos para cada teste se necessário

## Cenários de Teste a Implementar

### Busca de Clubes (`GET /club`)
- Busca sem filtros (paginação básica)
- Busca com filtro por nome
- Busca com filtro por cidade/estado
- Busca com filtros combinados
- Validação de parâmetros de paginação
- Retorno de lista vazia quando nenhum clube corresponde

### Detalhes do Clube (`GET /club/:id`)
- Obter detalhes de clube existente
- Erro 404 para clube inexistente
- Validação de formato do ID

## Status do Setup

✅ **COMPLETO** - A infraestrutura de testes está pronta para uso!

### Características Implementadas
- ✅ Setup da aplicação TestingModule
- ✅ Criação de usuários com diferentes roles
- ✅ Famílias com afiliação ativa configurada
- ✅ Criação de clubes para testes
- ✅ Cleanup cirúrgico específico para Club Controller
- ✅ Funções auxiliares para diferentes tipos de usuário

### Próximas Tarefas
- [ ] Implementar `search-clubs.e2e-spec.ts`
- [ ] Implementar `get-club-info.e2e-spec.ts`
- [ ] Criar testes para cenários de erro e validação
- [ ] Adicionar testes para regras de negócio específicas