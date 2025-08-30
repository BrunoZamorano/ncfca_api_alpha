---
status: completed
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


## Implementation Examples
look at the examples to understand how do we implement this. also see @.cursor/rules/tests-standards.mdc and @.cursor/rules/code-standards.mdc.
-   **Interface de Consulta:** `@src/application/queries/dependant-query/dependant.query.ts`
-   **Modelo de Visualização:** `@/src/application/queries/dependant-query/dependants-list-item.view.ts`
-   **Caso de Uso de Consulta:** `@src/application/use-cases/admin/list-dependants/list-dependants.ts`
-   **Implemented Query Prisma:** `@src/infraestructure/queries/dependant.query.prisma.ts`
-   **Controller of Dependants:** `@src/infraestructure/controllers/dependant/dependant.controller.ts`

## Subtasks

- [x] 5.1 Criar a `GetMyPendingRegistrations` com os parâmetros necessários (`holderId`) @in src/application/queries/tournament-query/tournament.query.ts
- [x] 5.2 Definir o modelo de visualização `GetMyPendingRegistrationsListItemView` com os campos a serem retornados pela API.
- [x] 5.3 Criar o use case de consulta CQRS (`GetMyPendingRegistrations`) para buscar os dados pelo QueryService -> Tournament Query. salve o use case em  em @/src/application/use-cases/tornament/, assim como o unit test.
- [x] 5.4 Adicionar o endpoint `GET /tournaments/my-pending-registrations` ao `TournamentController`.
- [x] 5.5 Criar testes E2E abrangentes para o endpoint (10 casos de teste cobrindo todos os cenários)

## Implementation Details

### Relevant Files
-   `src/application/queries/tournaments/get-my-pending-duo-registrations.query.ts`
-   `src/infraestructure/queries/tournaments/get-my-pending-duo-registrations.handler.ts`
-   `src/infraestructure/controllers/tournament.controller.ts`
## Success Criteria

- O endpoint da API retorna com sucesso uma lista de registros de dupla pendentes para o usuário autenticado.
- A consulta é eficiente e busca apenas os dados necessários.
- O endpoint está devidamente protegido.