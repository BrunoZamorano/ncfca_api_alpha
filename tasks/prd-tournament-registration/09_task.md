---
status: pending
---

<task_context>
<domain>application/use-cases</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>task:8.0</dependencies>
</task_context>

# Task 9.0: Application Layer: Implement Registration Use Cases

## Overview

This task involves creating the use cases that orchestrate the registration logic. The primary use case, `RequestIndividualRegistration`, will load the full `Tournament` aggregate, execute its domain logic, and save it back, respecting the optimistic locking mechanism.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>

<requirements>
- The use case must load the `Tournament` aggregate, including all its registrations.
- It must call the `tournament.requestIndividualRegistration()` method.
- The repository's save method must implement the optimistic lock check.
- The use case must handle `OptimisticLockError` and translate it to a `ConflictException`.
- Unit tests must be written for the use case.
</requirements>

## Subtasks

- [ ] 9.1 Implement the `RequestIndividualRegistration` use case.
- [ ] 9.2 In the use case, fetch the full `Tournament` aggregate from the repository.
- [ ] 9.3 Call the `tournament.requestIndividualRegistration()` method.
- [ ] 9.4 Update the `PrismaTournamentRepository` to handle saving the aggregate and checking the `version` during the update. If the row count is 0, throw a custom `OptimisticLockError`.
- [ ] 9.5 The use case should catch `OptimisticLockError` and re-throw it as a `ConflictException`.
- [ ] 9.6 Implement unit tests for the use case, mocking the repository and verifying that the aggregate's method is called.

## Implementation Details

### Use Case Logic

```typescript
// src/application/use-cases/tournament/request-individual-registration.use-case.ts (conceptual)
export class RequestIndividualRegistration {
  constructor(private readonly tournamentRepository: ITournamentRepository) {}

  async execute(input: RequestIndividualRegistrationInput): Promise<void> {
    try {
      const tournament = await this.tournamentRepository.findById(input.tournamentId);
      // ... load competitor user
      
      tournament.requestIndividualRegistration(competitor);

      await this.tournamentRepository.save(tournament);
    } catch (error) {
      if (error instanceof OptimisticLockError) {
        throw new ConflictException('This tournament was updated by someone else. Please try again.');
      }
      throw error;
    }
  }
}
```

### Repository Logic

```typescript
// src/infraestructure/repositories/tournament/prisma-tournament.repository.ts (conceptual)
async save(tournament: Tournament): Promise<void> {
  const result = await this.prisma.tournament.update({
    where: {
      id: tournament.id,
      version: tournament.version,
    },
    data: {
      // ... map data
      version: tournament.version + 1,
    },
  });

  if (!result) { // Prisma update returns the updated record, so check might need adjustment based on actual return value on failure
    throw new OptimisticLockError();
  }
}
```

### Relevant Files

- `src/application/use-cases/tournament/request-individual-registration.use-case.ts`
- `src/infraestructure/repositories/tournament/prisma-tournament.repository.ts`
- `src/domain/repositories/tournament.repository.ts`
- `src/application/use-cases/tournament/request-individual-registration.spec.ts`

## Success Criteria

- The use case correctly orchestrates the domain logic.
- The system correctly prevents race conditions via optimistic locking, returning a 409 status.
- Unit tests for the use case pass.
