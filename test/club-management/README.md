# Testes E2E - ClubManagement

Este diretório contém a infraestrutura e testes E2E para o módulo ClubManagement.

## Estrutura

- `setup.ts` - Funções de setup e utilitários comuns para todos os testes
- `setup-validation.e2e-spec.ts` - Teste de validação da infraestrutura
- Futuros arquivos de teste seguirão o padrão: `nome-da-funcionalidade.e2e-spec.ts`

## Rotas Disponíveis no ClubManagementController

O controller possui as seguintes rotas que podem ser testadas:

### Informações do Clube
- `GET /club-management/my-club` - Obtém informações do clube do diretor

### Gestão do Clube
- `PATCH /club-management` - Atualiza informações do clube

### Gestão de Enrollments
- `GET /club-management/my-club/enrollments` - Lista todos os enrollments
- `GET /club-management/:clubId/enrollments/pending` - Lista enrollments pendentes
- `POST /club-management/enrollments/:enrollmentId/approve` - Aprova enrollment
- `POST /club-management/enrollments/:enrollmentId/reject` - Rejeita enrollment

### Gestão de Membros
- `GET /club-management/my-club/members` - Lista membros ativos
- `POST /club-management/membership/:membershipId/revoke` - Revoga membership

## Como Usar o Setup

### 1. Importar o Setup
```typescript
import {
  setupClubManagementApp,
  createClubOwnerUser,
  createTestClub,
  clubManagementCleanup,
} from './setup';
```

### 2. Configurar o Teste
```typescript
describe('(E2E) MinhaFuncionalidade', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clubOwner: ClubManagementTestUser;
  const testUsers: string[] = [];

  beforeAll(async () => {
    // Setup da aplicação
    ({ app, prisma } = await setupClubManagementApp());
    
    // Criar usuário dono do clube
    clubOwner = await createClubOwnerUser(app, prisma);
    testUsers.push(clubOwner.userId);
    
    // Criar clube para o usuário
    await createTestClub(prisma, clubOwner.userId);
  });

  afterAll(async () => {
    // Cleanup cirúrgico
    await clubManagementCleanup(prisma, testUsers);
    await app.close();
  });
});
```

### 3. Funções Disponíveis

#### Usuários
- `createClubOwnerUser()` - Cria usuário com role DONO_DE_CLUBE
- `createRegularUser()` - Cria usuário com role SEM_FUNCAO
- `createAdminUser()` - Cria usuário com role ADMIN

#### Entidades de Teste
- `createTestClub()` - Cria um clube
- `createTestDependant()` - Cria um dependente
- `createTestEnrollmentRequest()` - Cria solicitação de enrollment
- `createTestClubMembership()` - Cria membership ativa

#### Cleanup
- `clubManagementCleanup()` - Remove todos os dados relacionados aos usuários de teste

## Padrões a Seguir

### 1. Nomenclatura
- Describe: `(E2E) NomeDaFuncionalidade`
- Tests: `Deve ...` ou `Não deve ...`

### 2. Estrutura AAA
```typescript
it('Deve fazer alguma coisa', async () => {
  // Arrange - Preparar dados
  const dados = { ... };
  
  // Act - Executar ação
  const response = await request(app.getHttpServer())...;
  
  // Assert - Verificar resultado
  expect(response.status).toBe(200);
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

## Status do Setup

✅ **COMPLETO** - A infraestrutura de testes está pronta para uso!

### Características Implementadas
- ✅ Setup da aplicação TestingModule
- ✅ Criação de usuários com diferentes roles (DONO_DE_CLUBE, SEM_FUNCAO, ADMIN)
- ✅ Famílias com afiliação ativa (data de expiração configurada)
- ✅ Criação de clubes para testes
- ✅ Criação de dependentes para testes de enrollment
- ✅ Criação de enrollment requests e memberships
- ✅ Cleanup cirúrgico específico para ClubManagement
- ✅ Exemplo funcional demonstrando todas as capacidades

### Próximas Tarefas
- [ ] Implementar testes específicos para cada rota do ClubManagementController
- [ ] Criar testes para cenários de erro e validação
- [ ] Adicionar testes para regras de negócio específicas