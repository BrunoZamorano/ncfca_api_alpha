---
status: completed
---

<task_context>
<domain>test/training</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 1.0: Implementar Módulo de Setup para Testes de Treinamento

## Visão Geral

Esta tarefa consiste em criar o arquivo `setup.ts` no diretório `test/training`. Este módulo é a base para todos os outros arquivos de teste do `TrainingController` e deve fornecer funções utilitárias para inicializar o ambiente de teste, criar dados (usuários, treinamentos) e realizar a limpeza pós-teste.

<import>**DEVE LER ANTES DE INICIAR** @.cursor/rules/tests-standards.mdc</import>

<requirements>
- O arquivo deve ser criado em `test/training/setup.ts`.
- Deve espelhar a estrutura e funcionalidades do `test/club-management/setup.ts`.
- A limpeza de dados deve ser "cirúrgica", utilizando os `userIds` para remover apenas os dados criados durante o teste.
</requirements>

## Subtarefas

- [ ] 1.1: Implementar a função `setupTrainingApp` para inicializar um `TestingModule` do NestJS com os módulos e provedores necessários.
- [ ] 1.2: Implementar as funções `createAdminUser`, `createClubOwnerUser`, e `createRegularUser` para gerar usuários com diferentes papéis e afiliação familiar ativa.
- [ ] 1.3: Implementar a função `createTestTraining` para criar registros de treinamento no banco de dados com dados customizáveis.
- [ ] 1.4: Implementar a função `trainingCleanup` que recebe uma lista de `userIds` e remove todos os dados associados (usuários, famílias, treinamentos) do banco de dados.

## Detalhes da Implementação

Conforme a especificação técnica, o `setup.ts` deve exportar as seguintes funções:

```typescript
function setupTrainingApp(): Promise<{ app: INestApplication; prisma: PrismaClient }>;
function createAdminUser(prisma: PrismaClient): Promise<{ user: User; accessToken: string }>;
function createClubOwnerUser(prisma: PrismaClient): Promise<{ user: User; accessToken: string }>;
function createRegularUser(prisma: PrismaClient): Promise<{ user: User; accessToken: string }>;
function createTestTraining(prisma: PrismaClient, data: Partial<Training>): Promise<Training>;
function trainingCleanup(prisma: PrismaClient, userIds: string[]): Promise<void>;
```

### Arquivos Relevantes

- `test/training/setup.ts` (Arquivo a ser criado)

### Arquivos Dependentes

- `test/utils/prisma/create-test-user.ts`
- `test/utils/prisma/cleanup.ts`

## Critérios de Sucesso

- O arquivo `test/training/setup.ts` é criado e exporta todas as funções necessárias.
- As funções são capazes de configurar um ambiente de teste funcional e isolado.
- A função `trainingCleanup` remove com sucesso todos os dados criados, sem afetar outros dados no banco.
