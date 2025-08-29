---
status: complete
---

<task_context>
<domain>infraestructure/database</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Task 1.0: Database Schema Migration

## Overview

Esta tarefa envolve a modificação do esquema do Prisma para suportar a funcionalidade de registro de duplas. Isso inclui a atualização da entidade `Registration` e do enum `RegistrationStatus`.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/sql-database.mdc</import>

<requirements>
- As alterações no esquema devem ser retrocompatíveis.
- A migração deve ser gerada e revisada antes da aplicação.
</requirements>

## Subtasks

- [ ] 1.1 Modificar `prisma/schema.prisma` para atualizar o enum `RegistrationStatus` com `PENDING_APPROVAL` e `REJECTED`.
- [ ] 1.2 Modificar o modelo `Registration` no esquema para adicionar os campos `partner_id` (opcional) e `version` (para travamento otimista).
- [ ] 1.3 Atualizar a restrição única para o modelo `Registration` para incluir `partner_id`.
- [ ] 1.4 Gerar o novo arquivo de migração do banco de dados usando `npx prisma migrate dev`.
- [ ] 1.5 Revisar o arquivo de migração SQL gerado para garantir que ele esteja correto e não cause perda de dados.
- [ ] 1.6 Aplicar a migração ao banco de dados de desenvolvimento.

## Implementation Examples

- `@prisma/schema.prisma`

### Relevant Files

-   `prisma/schema.prisma`
-   `prisma/migrations/`

## Success Criteria

- O esquema do Prisma é atualizado com sucesso.
- Um novo arquivo de migração é gerado e verificado.
- A migração é aplicada com sucesso ao banco de dados de desenvolvimento sem erros.
