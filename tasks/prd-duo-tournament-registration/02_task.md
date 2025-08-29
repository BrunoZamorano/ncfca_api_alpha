---
status: complete
---

<task_context>
<domain>domain/entities</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
</task_context>

# Task 2.0: Enhance Registration Entity (as part of Tournament Aggregate)

## Overview

Esta tarefa foca em modificar a entidade `Registration` para incluir os campos necessários para o registro de duplas. É importante notar que **`Registration` não é uma raiz de agregado**, but sim uma entidade filha gerenciada pelo agregado `Tournament`. Como tal, esta tarefa não implementará lógica de negócio (métodos), mas apenas atualizará a estrutura de dados da entidade.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>

<requirements>
- A entidade `Registration` deve ser atualizada para refletir as alterações do esquema do Prisma.
- Nenhum método de mudança de estado (como `accept` ou `reject`) deve ser adicionado diretamente a esta entidade. Tais operações devem ser tratadas pela raiz do agregado `Tournament`.
</requirements>

## Subtasks

- [x] 2.1 Atualizar os campos da entidade `Registration` em `src/domain/entities/registration/registration.entity.ts` para incluir `partnerId`, `status` e `version` para alinhar com as alterações do esquema do Prisma.
- [x] 2.2 Garantir que o construtor da entidade e quaisquer métodos de fábrica relacionados sejam atualizados para lidar com os novos campos.

## Implementation Examples

- `@src/domain/entities/club-membership/club-membership.entity.ts`

### Relevant Files

-   `src/domain/entities/registration/registration.entity.ts`

## Success Criteria

- A classe da entidade `Registration` reflete com precisão a estrutura da tabela do banco de dados, incluindo os novos campos.
- O código compila sem erros após as alterações na entidade.