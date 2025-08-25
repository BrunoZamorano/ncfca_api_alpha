---
status: completed
---
<task_context>
<domain>engine/domain/entities</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Task 2.0: Domain Layer Implementation

## Overview

This task focuses on creating the core domain logic for the Tournament feature. This includes the `Tournament` entity, which encapsulates business rules, the repository interface for persistence, and the data mapper.

<requirements>
- The `Tournament` entity must contain all business logic for creation, updates, and deletion.
- Unit tests must provide full coverage for the entity's business rules.
- A repository interface must be defined for write operations.
- The dependency injection symbol for the repository must be centralized.
- A data mapper must be created to translate between the domain entity and the Prisma model.
</requirements>

## Subtasks

- [x] 2.1 Create the `Tournament` entity class with its properties and methods.
- [x] 2.2 Implement unit tests for the `Tournament` entity, following the project's test standards.
- [x] 2.3 Define the `TournamentRepository` interface.
- [x] 2.4 Add the `TOURNAMENT_REPOSITORY` symbol to `src/shared/constants/repository-constants.ts`.
- [x] 2.5 Implement the `TournamentMapper` to convert between the entity and the Prisma model.

## Implementation Details

### Test Naming Convention
```typescript
// src/domain/entities/tournament/tournament.spec.ts
describe('(UNIT) Tournament Entity', () => {
  it('Deve criar um torneio com dados válidos', () => {
    // ...
  });

  it('Não deve permitir que a data final de inscrição seja anterior à data inicial', () => {
    // ...
  });

  it('Não deve permitir a atualização de um torneio que já possui inscrições', () => {
    // ...
  });
});
```

### Repository Interface & Constant
```typescript
// src/shared/constants/repository-constants.ts
export const TOURNAMENT_REPOSITORY = Symbol('TOURNAMENT_REPOSITORY');

// src/domain/repositories/tournament.repository.ts
import { Tournament } from '@/domain/entities/tournament/tournament.entity';

export interface TournamentRepository {
  save(tournament: Tournament): Promise<void>;
  findById(id: string): Promise<Tournament | null>;
}
```

### Relevant Files
- `src/domain/entities/tournament/tournament.entity.ts`
- `src/domain/entities/tournament/tournament.spec.ts`
- `src/domain/repositories/tournament.repository.ts`
- `src/shared/constants/repository-constants.ts`
- `src/shared/mappers/tournament.mapper.ts`

## Success Criteria
- The `Tournament` entity is implemented with all specified business logic.
- All unit tests for the `Tournament` entity pass successfully and follow naming conventions.
- The `TOURNAMENT_REPOSITORY` symbol is correctly added to the constants file.
- The `TournamentMapper` correctly converts data between formats.
