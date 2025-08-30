---
status: pending
---

<task_context>
<domain>application/use-cases</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>domain/entities, infraestructure/database</dependencies>
</task_context>

# Task 7.0: Implement Reject Duo Registration Workflow

## Overview

Esta tarefa implementa o fluxo para um usuário rejeitar um convite de registro de dupla. O caso de uso irá carregar a raiz do agregado `Tournament` e usar seu método para rejeitar o registro.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>

<requirements>
- O caso de uso deve carregar o agregado `Tournament`.
- A operação deve ser transacional.
</requirements>

## Subtasks

- [ ] 7.1 Criar o `RejectDuoRegistrationInput` (`registrationId`).
- [ ] 7.2 Criar testes de unidade para o `RejectDuoRegistrationUseCase`.
- [ ] 7.3 Implementar o `RejectDuoRegistrationUseCase`, que carrega o agregado `Tournament`, chama `tournament.rejectDuoRegistration(registrationId)`, e persiste a mudança.
- [ ] 7.4 Adicionar o endpoint `POST /registrations/:id/reject` ao controller.
- [ ] 7.5 Create e2e tests (see @test/club-management/README.md)
- [ ] 7.8 Run pnpm test to run the e2e tests
- [ ] 7.9 run npx eslint ./test to see the lint on test folder only.

## Implementation Examples

- `@src/application/use-cases/club-request/approve-club-request/approve-club-request.use-case.ts`
- `@test/club-management/README.md`

### Relevant Files

-   `src/application/use-cases/tournaments/reject-duo-registration.use-case.ts`
-   `src/infraestructure/controllers/tournament.controller.ts`
-   `src/domain/entities/tournament/tournament.entity.ts`
-   `src/domain/entities/tournament/registration.entity.ts`
-   `src/domain/entities/tournament/registration-sync.entity.ts`


## Success Criteria

- O caso de uso `RejectDuoRegistration` é implementado e passa nos testes.
- O endpoint da API funciona, e chamar ele muda o status do `Registration` para `REJECTED`.
- Um evento `DuoRegistration.Rejected` é devidamente enfileirado através do outbox transacional.