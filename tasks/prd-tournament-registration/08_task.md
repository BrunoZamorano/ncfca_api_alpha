---
status: pending
---

<task_context>
<domain>domain/entities</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>task:7.0</dependencies>
</task_context>

# Task 8.0: Domain Layer: Implement Tournament Aggregate Root

## Overview

This task focuses on implementing the core domain logic for registration. The `Tournament` entity will act as the **Aggregate Root (AR)**, responsible for enforcing all business rules (invariants) related to creating a registration. It will load its list of current registrations to perform these checks and will dispatch a domain event upon success.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>

<requirements>
- The `Tournament` entity must be enhanced to manage its `Registration` children.
- A new method, `requestIndividualRegistration`, must be added to the `Tournament` entity.
- This method must contain all validation logic (date checks, type checks, duplicate competitor checks).
- Upon successful validation, the method should create a `Registration` and dispatch a `RegistrationConfirmed` domain event.
- Unit tests must be created to validate all business rules within the aggregate.
</requirements>

## Subtasks

- [ ] 8.1 Implement the `Registration` entity class.
- [ ] 8.2 Implement the `Tournament` entity as an Aggregate Root, including a private list of `_registrations`.
- [ ] 8.3 Implement the `tournament.requestIndividualRegistration(competitor: User)` method.
- [ ] 8.4 Inside the method, check if the registration period is open, the tournament type is `INDIVIDUAL`, and the competitor is not already registered.
- [ ] 8.5 If checks pass, create a new `Registration` instance, add it to the internal list, and dispatch a `RegistrationConfirmed` event using an event dispatcher.
- [ ] 8.6 Create comprehensive unit tests for the `Tournament` aggregate's new method, covering all success and failure scenarios.

## Implementation Details

### Tournament Aggregate Root Logic

```typescript
// src/domain/entities/tournament/tournament.entity.ts (conceptual)

export class Tournament extends AggregateRoot {
  // ... existing properties

  private _registrations: Registration[];

  public requestIndividualRegistration(competitor: User): void {
    // 1. Validate invariants
    if (this.type !== TournamentType.INDIVIDUAL) {
      throw new TournamentTypeInvalidError();
    }
    if (!this.isRegistrationOpen()) {
      throw new RegistrationPeriodClosedError();
    }
    if (this._registrations.some(reg => reg.competitorId === competitor.id)) {
      throw new CompetitorAlreadyRegisteredError();
    }

    // 2. Create the new registration
    const newRegistration = Registration.create(this.id, competitor.id);
    this._registrations.push(newRegistration);

    // 3. Dispatch domain event
    this.apply(new RegistrationConfirmed(newRegistration.id));
  }
}
```

### Relevant Files

- `src/domain/entities/tournament/tournament.entity.ts`
- `src/domain/entities/registration/registration.entity.ts`
- `src/domain/events/registration-confirmed.event.ts`
- `src/domain/entities/tournament/tournament.spec.ts`

## Success Criteria

- The `Tournament` entity correctly enforces all registration-related business rules.
- A `RegistrationConfirmed` event is dispatched on successful registration.
- All unit tests for the aggregate pass, confirming the logic is sound.
