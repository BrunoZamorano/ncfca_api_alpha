---
status: pending
---

<task_context>
<domain>application/use-cases</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>domain/entities, infraestructure/database</dependencies>
</task_context>

# Task 4.0: Implement Request Duo Registration Workflow

## Overview

Esta tarefa abrange a implementação da camada de aplicação e infraestrutura para o fluxo de solicitação de registro de dupla. Isso inclui o caso de uso, o endpoint da API e a garantia de que a operação seja transacional.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>

<requirements>
- O caso de uso deve orquestrar a chamada ao agregado `Tournament` e a persistência.
- A persistência do `Tournament` e do `RegistrationSync` (outbox transacional) deve ocorrer em uma única transação de banco de dados.
- O endpoint da API deve ser protegido e validar adequadamente a entrada.
</requirements>

## Subtasks

- [ ] 4.1 Criar o `RequestDuoRegistrationCommand` com os campos necessários (`tournamentId`, `competitorId`, `partnerId`).
- [ ] 4.2 Criar testes de unidade para o `RequestDuoRegistrationUseCase`, zombando dos repositórios e do gerenciador de transações.
- [ ] 4.3 Implementar o `RequestDuoRegistrationUseCase`, garantindo que ele use uma transação para salvar o agregado `Tournament` e a entidade `RegistrationSync`.
- [ ] 4.4 Adicionar o endpoint `POST /tournaments/request-duo-registration` ao `TournamentController`.
- [ ] 4.5 Criar o DTO (Data Transfer Object) para o novo endpoint com as devidas validações.

## Implementation Examples

- `@src/application/use-cases/club-request/approve-club-request/approve-club-request.use-case.ts`

### Relevant Files

-   `src/application/use-cases/tournaments/request-duo-registration.use-case.ts`
-   `src/infraestructure/controllers/tournament.controller.ts`
-   `src/infraestructure/dtos/tournaments/`
-   `src/domain/entities/tournament/tournament.entity.ts`

## Success Criteria

- O caso de uso `RequestDuoRegistration` é implementado e passa em todos os testes de unidade.
- O endpoint da API é criado e funciona conforme o esperado.
- A solicitação de registro de dupla resulta em um novo registro de `Registration` com status `PENDING_APPROVAL` e um registro `RegistrationSync` no banco de dados.
- A operação inteira é atômica (transacional).
