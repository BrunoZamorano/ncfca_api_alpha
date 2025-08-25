---
status: pending
---
<task_context>
<domain>engine/testing/e2e</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>api</dependencies>
</task_context>

# Task 6.0: End-to-End Testing Structure & Implementation

## Overview

This final task is to create a comprehensive suite of end-to-end (E2E) tests for the `TournamentController`. Following the project's convention of one test suite per endpoint, this task involves creating a shared setup file and then individual test files for each of the five controller actions, with detailed test cases specified below.

<requirements>
- A shared `setup.ts` file must be created for common E2E testing utilities.
- A separate E2E test file must be created for each of the 5 endpoints in the `TournamentController`.
- Test descriptions must follow the `(E2E) UseCase` and Portuguese business rule conventions.
- All tests must perform surgical cleanup of any created data.
</requirements>

## Subtasks

- [ ] 6.1 Create a `test/tournament/` directory.
- [ ] 6.2 Create `test/tournament/setup.ts` to handle common test setup (app initialization, user creation, data cleanup).
- [ ] 6.3 Create and implement `test/tournament/create-tournament.e2e-spec.ts`.
- [ ] 6.4 Create and implement `test/tournament/list-tournaments.e2e-spec.ts`.
- [ ] 6.5 Create and implement `test/tournament/get-tournament-details.e2e-spec.ts`.
- [ ] 6.6 Create and implement `test/tournament/update-tournament.e2e-spec.ts`.
- [ ] 6.7 Create and implement `test/tournament/delete-tournament.e2e-spec.ts`.

## Test Case Specification

### 1. `create-tournament.e2e-spec.ts`
- **`describe('(E2E) CreateTournament', ...)`**
  - **Success:**
    - `it('Deve criar um torneio com dados válidos e retornar 201', ...)` - (As Admin)
  - **Auth/Authz:**
    - `it('Não deve permitir a criação por um Holder e deve retornar 403', ...)`
    - `it('Não deve permitir a criação por um usuário não autenticado e deve retornar 401', ...)`
  - **Validation:**
    - `it('Não deve criar um torneio com nome faltando e deve retornar 400', ...)`
    - `it('Não deve criar um torneio com tipo inválido e deve retornar 400', ...)`
    - `it('Não deve criar um torneio com data de inscrição final anterior à inicial e deve retornar 400', ...)`
    - `it('Não deve criar um torneio com formato de data inválido e deve retornar 400', ...)`

### 2. `list-tournaments.e2e-spec.ts`
- **`describe('(E2E) ListTournaments', ...)`**
  - **Success:**
    - `it('Deve retornar uma lista de torneios para um Admin e retornar 200', ...)`
    - `it('Deve retornar uma lista de torneios para um Holder e retornar 200', ...)`
    - `it('Deve retornar uma lista vazia se não houver torneios', ...)`
  - **Auth/Authz:**
    - `it('Não deve permitir o acesso por um usuário não autenticado e deve retornar 401', ...)`
  - **Filtering & Logic:**
    - `it('Não deve incluir torneios deletados na lista para um Holder', ...)`
    - `it('Deve incluir torneios deletados na lista para um Admin se o filtro showDeleted=true for usado', ...)`
    - `it('Deve filtrar torneios corretamente por nome', ...)`
    - `it('Deve filtrar torneios corretamente por tipo', ...)`
    - `it('Deve suportar paginação corretamente', ...)`

### 3. `get-tournament-details.e2e-spec.ts`
- **`describe('(E2E) GetTournamentDetails', ...)`**
  - **Success:**
    - `it('Deve retornar os detalhes de um torneio para um Admin e retornar 200', ...)`
    - `it('Deve retornar os detalhes de um torneio para um Holder e retornar 200', ...)`
  - **Auth/Authz:**
    - `it('Não deve permitir o acesso por um usuário não autenticado e deve retornar 401', ...)`
  - **Logic:**
    - `it('Deve retornar 404 se o ID do torneio não existir', ...)`
    - `it('Não deve retornar um torneio deletado para um Holder e deve retornar 404', ...)`

### 4. `update-tournament.e2e-spec.ts`
- **`describe('(E2E) UpdateTournament', ...)`**
  - **Success:**
    - `it('Deve atualizar um torneio com dados válidos e retornar 200', ...)` - (As Admin)
  - **Auth/Authz:**
    - `it('Não deve permitir a atualização por um Holder e deve retornar 403', ...)`
    - `it('Não deve permitir a atualização por um usuário não autenticado e deve retornar 401', ...)`
  - **Validation & Logic:**
    - `it('Deve retornar 404 se o ID do torneio a ser atualizado não existir', ...)`
    - `it('Não deve atualizar um torneio com dados inválidos e deve retornar 400', ...)`
    - `it('[Future] Não deve atualizar um torneio que já possui inscrições', ...)` - (Mark as skipped/pending)

### 5. `delete-tournament.e2e-spec.ts`
- **`describe('(E2E) DeleteTournament', ...)`**
  - **Success:**
    - `it('Deve realizar o soft-delete de um torneio e retornar 200', ...)` - (As Admin)
  - **Auth/Authz:**
    - `it('Não deve permitir a deleção por um Holder e deve retornar 403', ...)`
    - `it('Não deve permitir a deleção por um usuário não autenticado e deve retornar 401', ...)`
  - **Logic:**
    - `it('Deve retornar 404 se o ID do torneio a ser deletado não existir', ...)`
    - `it('Deve ser idempotente e retornar 200 se o torneio já estiver deletado', ...)`
    - `it('[Future] Não deve deletar um torneio que já possui inscrições', ...)` - (Mark as skipped/pending)

### Relevant Files

- `test/tournament/setup.ts`
- `test/tournament/create-tournament.e2e-spec.ts`
- `test/tournament/list-tournaments.e2e-spec.ts`
- `test/tournament/get-tournament-details.e2e-spec.ts`
- `test/tournament/update-tournament.e2e-spec.ts`
- `test/tournament/delete-tournament.e2e-spec.ts`

## Success Criteria

- The command `pnpm run test:e2e -- test/tournament/` passes successfully.
- Each endpoint has its own dedicated, correctly named test file.
- All test suites follow project naming, structure, and cleanup conventions and implement the specified test cases.
