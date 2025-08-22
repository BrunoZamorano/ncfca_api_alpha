# Testes E2E - DependantController

Este diretório contém os testes end-to-end (E2E) completos para o `DependantController`, cobrindo os endpoints de adição e listagem de dependentes.

## Estrutura dos Testes

### Arquivos Principais

- **`setup.ts`** - Infraestrutura compartilhada para todos os testes E2E do módulo
- **`add-dependant.e2e-spec.ts`** - Testes para `POST /dependants` (Tarefa 2.0)
- **`list-dependants.e2e-spec.ts`** - Testes para `GET /dependants` (Tarefa 2.0)
- **`setup-validation.e2e-spec.ts`** - Validação da infraestrutura de testes

## Endpoints Testados

### POST /dependants
Criação de novos dependentes na família do usuário autenticado.

**Cenários cobertos:**
- ✅ Criação com dados válidos completos
- ✅ Criação com dados mínimos (campos opcionais)
- ✅ Validação de todos os tipos de relacionamento
- ✅ Validação de campos obrigatórios
- ✅ Validação de formato de dados
- ✅ Validação de tipos de dados
- ✅ Autenticação e autorização
- ✅ Regras de negócio (status da família)
- ✅ Rejeição de campos extras

### GET /dependants
Listagem de todos os dependentes da família do usuário autenticado.

**Cenários cobertos:**
- ✅ Listagem com dados existentes
- ✅ Listagem vazia (sem dependentes)
- ✅ Diferentes tipos de relacionamento
- ✅ Informações completas dos dependentes
- ✅ Isolamento entre famílias
- ✅ Segurança de acesso
- ✅ Integridade dos dados
- ✅ Operações concorrentes
- ✅ Casos extremos (muitos dependentes)

## Padrões Seguidos

### Estrutura AAA (Arrange, Act, Assert)
Todos os testes seguem a estrutura:
- **Arrange**: Preparação dos dados e configuração
- **Act**: Execução da ação/chamada da API
- **Assert**: Verificação dos resultados

### Isolamento entre Testes
- Cleanup cirúrgico após cada execução
- Criação de usuários únicos por teste quando necessário
- Verificação de isolamento entre famílias

### Validações Abrangentes
- Campos obrigatórios e opcionais
- Formatos de dados válidos/inválidos
- Tipos de dados corretos
- Mensagens de erro padronizadas
- Códigos de status HTTP adequados

## Utilitários de Setup

### Funções Principais

- **`setupDependantApp()`** - Inicializa aplicação de teste
- **`createRegularUser()`** - Cria usuário regular com família
- **`createAdminUser()`** - Cria usuário administrador
- **`createTestDependant()`** - Cria dependente para testes
- **`createMultipleTestDependants()`** - Cria múltiplos dependentes
- **`createIsolatedFamily()`** - Cria família isolada para testes
- **`dependantCleanup()`** - Cleanup cirúrgico dos dados

### Status de Família Suportados

- `FamilyStatus.AFFILIATED` - Família afiliada (pode criar dependentes)
- `FamilyStatus.NOT_AFFILIATED` - Família não afiliada (restrições aplicáveis)

## Execução dos Testes

```bash
# Executar todos os testes de dependentes
pnpm run test:e2e test/dependant/

# Executar apenas testes de adição
pnpm run test:e2e test/dependant/add-dependant.e2e-spec.ts

# Executar apenas testes de listagem
pnpm run test:e2e test/dependant/list-dependants.e2e-spec.ts

# Executar com output detalhado
pnpm run test:e2e test/dependant/ --verbose
```

## Estatísticas de Cobertura

- **Total de testes**: 44
- **Testes de adição**: 20
- **Testes de listagem**: 14
- **Testes de infraestrutura**: 10
- **Taxa de sucesso**: 100%

## Cenários de Validação

### Campos Obrigatórios
- firstName (mínimo 2 caracteres)
- lastName (mínimo 2 caracteres)
- birthdate (formato ISO válido)
- relationship (enum válido)
- sex (enum válido)
- email (string obrigatória)

### Campos Opcionais
- phone (string opcional)

### Regras de Negócio
- Apenas famílias afiliadas podem criar dependentes
- Usuários só podem ver dependentes da própria família
- Validação rigorosa de tipos de dados
- Rejeição de campos extras não permitidos

## Considerações de Segurança

- Autenticação obrigatória para todas as operações
- Isolamento completo entre famílias
- Validação de proprietário dos recursos
- Tokens inválidos rejeitados adequadamente

## Manutenção

Os testes são auto-contidos e incluem:
- Setup automático da aplicação
- Criação e limpeza de dados de teste
- Verificação de isolamento
- Validação de integridade dos dados

Para adicionar novos cenários, siga os padrões estabelecidos e utilize as funções utilitárias disponíveis no `setup.ts`.