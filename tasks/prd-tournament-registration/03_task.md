---
status: completed
---
<task_context>
<domain>engine/application/use-cases</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>domain</dependencies>
</task_context>

# Task 3.0: Application Layer: Write Operations

## Overview

This task involves implementing the application-level use cases for all write operations (Create, Update, Delete) related to tournaments. These use cases will orchestrate the domain entities and repositories to perform the required actions.

<requirements>
- Use cases must be created for creating, updating, and soft-deleting tournaments.
- Each use case must be covered by unit tests that follow the project's naming conventions.
- Use cases should correctly handle exceptions, such as `NotFoundException`.
</requirements>

## Subtasks

- [x] 3.1 Implement `CreateTournament` and its unit tests.
- [x] 3.2 Implement `UpdateTournament` and its unit tests.
- [x] 3.3 Implement `DeleteTournament` and its unit tests.

## Implementation Details

### Testing Naming Convention

-   **`create-tournament.use-case.spec.ts`:**
    -   `describe('(UNIT) CreateTournamentUseCase', ...)`
    -   `it('Deve criar um novo torneio', ...)`
-   **`update-tournament.use-case.spec.ts`:**
    -   `describe('(UNIT) UpdateTournamentUseCase', ...)`
    -   `it('Deve atualizar um torneio existente', ...)`
    -   `it('Não deve atualizar um torneio inexistente', ...)`
-   **`delete-tournament.use-case.spec.ts`:**
    -   `describe('(UNIT) DeleteTournamentUseCase', ...)`
    -   `it('Deve realizar o soft-delete de um torneio', ...)`
    -   `it('Não deve deletar um torneio inexistente', ...)`

### Relevant Files

- `src/application/use-cases/tournament/create-tournament.use-case.ts`
- `src/application/use-cases/tournament/create-tournament.use-case.spec.ts`
- `src/application/use-cases/tournament/update-tournament.use-case.ts`
- `src/application/use-cases/tournament/update-tournament.use-case.spec.ts`
- `src/application/use-cases/tournament/delete-tournament.use-case.ts`
- `src/application/use-cases/tournament/delete-tournament.use-case.spec.ts`

### Dependent Files

- `src/domain/entities/tournament/tournament.entity.ts`
- `src/domain/repositories/tournament.repository.ts`

## Success Criteria

- All three write-operation use cases are implemented correctly.
- All unit tests for the use cases pass and follow the specified naming conventions.
- The use cases correctly interact with the mocked repository and domain entity.
