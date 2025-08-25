---
status: pending
---
<task_context>
<domain>engine/application/queries</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Task 4.0: Application Layer: Read Operations

## Overview

This task covers the implementation of the read model (CQRS Query side) for tournaments. This includes defining the query interface, creating the Prisma implementation for fetching data, and implementing the use cases that consume this data.

<requirements>
- A `TournamentQuery` interface must be defined for all read operations.
- A Prisma-based implementation of the `TournamentQuery` interface must be created.
- Use cases for getting a single tournament and listing multiple tournaments must be implemented.
- Unit tests must be provided for the read-path use cases, following project conventions.
</requirements>

## Subtasks

- [ ] 4.1 Define the `TournamentQuery` interface and its associated DTOs.
- [ ] 4.2 Create `src/shared/constants/query-constants.ts` and add the `TOURNAMENT_QUERY` symbol.
- [ ] 4.3 Implement the `PrismaTournamentQuery` class in the infrastructure layer.
- [ ] 4.4 Implement the `GetTournamentUseCase` and its unit tests.
- [ ] 4.5 Implement the `ListTournamentsUseCase` and its unit tests.

## Implementation Details

### CQRS Query Interface & Constant
```typescript
// src/shared/constants/query-constants.ts
export const TOURNAMENT_QUERY = Symbol('TOURNAMENT_QUERY');

// src/application/queries/tournament-query/tournament.query.ts
export interface TournamentQuery {
  findById(id: string, showDeleted?: boolean): Promise<TournamentDetailsDto | null>;
  search(query: ListTournamentsQueryDto): Promise<TournamentListItemDto[]>;
}
```

### Testing Naming Convention
- **`get-tournament.use-case.spec.ts`:**
  - `describe('(UNIT) GetTournamentUseCase', ...)`
  - `it('Deve retornar os detalhes de um torneio', ...)`
  - `it('Não deve retornar um torneio inexistente', ...)`
- **`list-tournaments.use-case.spec.ts`:**
  - `describe('(UNIT) ListTournamentsUseCase', ...)`
  - `it('Deve retornar uma lista de torneios', ...)`

### Relevant Files
- `src/application/queries/tournament-query/tournament.query.ts`
- `src/shared/constants/query-constants.ts`
- `src/infraestructure/queries/tournament/prisma-tournament.query.ts`
- `src/application/use-cases/tournament/get-tournament.use-case.ts`
- `src/application/use-cases/tournament/get-tournament.use-case.spec.ts`
- `src/application/use-cases/tournament/list-tournaments.use-case.ts`
- `src/application/use-cases/tournament/list-tournaments.use-case.spec.ts`

## Success Criteria
- The `TournamentQuery` interface and its Prisma implementation are complete.
- The `TOURNAMENT_QUERY` symbol is centralized in the constants file.
- The read use cases correctly retrieve data via the query service.
- All unit tests for the read use cases pass and follow naming conventions.
