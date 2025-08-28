---
status: pending
---

<task_context>
<domain>application/queries</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>infraestructure/database</dependencies>
</task_context>

# Task 5.0: Implement Get Pending Registrations Workflow

## Overview

Esta tarefa foca na implementação do fluxo de recuperação (leitura) para que os usuários possam ver os convites de dupla pendentes. Segue o padrão CQRS, onde a consulta buscará os dados diretamente do banco de dados para eficiência.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>

<requirements>
- A consulta deve buscar apenas registros com status `PENDING_APPROVAL` onde o usuário atual é o `partnerId`.
- O endpoint deve ser seguro e acessível apenas por usuários autenticados.
</requirements>

## Subtasks

- [ ] 5.1 Criar a `GetMyPendingDuoRegistrationsQuery` com os parâmetros necessários (ex: `userId`).
- [ ] 5.2 Definir o modelo de visualização `GetMyPendingDuoRegistrationsListItemView` com os campos a serem retornados pela API.
- [ ] 5.3 Criar o manipulador de consulta CQRS (`GetMyPendingDuoRegistrationsQueryHandler`) para buscar os dados diretamente do banco de dados.
- [ ] 5.4 Adicionar o endpoint `GET /tournaments/my-pending-registrations` ao `TournamentController`.

## Implementation Examples

-   **Interface de Consulta:** `@src/application/queries/club-query/club.query.ts`
-   **Modelo de Visualização (View Model):** `@src/application/queries/enrollment-query/my-enrollment-request-item.view.ts`
-   **Caso de Uso de Consulta:** `@src/application/use-cases/enrollment/list-my-enrollment-requests/list-my-enrollment-requests.ts`

### Relevant Files

-   `src/application/queries/tournaments/get-my-pending-duo-registrations.query.ts`
-   `src/infraestructure/queries/tournaments/get-my-pending-duo-registrations.handler.ts`
-   `src/infraestructure/controllers/tournament.controller.ts`

## Success Criteria

- O endpoint da API retorna com sucesso uma lista de registros de dupla pendentes para o usuário autenticado.
- A consulta é eficiente e busca apenas os dados necessários.
- O endpoint está devidamente protegido.