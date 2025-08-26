---
status: pending
---

<task_context>
<domain>application/listeners</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>task:8.0</dependencies>
</task_context>

# Task 11.0: Application Layer: Handle Domain Events

## Overview

This task implements the crucial decoupling of side effects from the main business logic. You will create a listener that subscribes to the `RegistrationConfirmed` domain event. The sole responsibility of this listener is to create the `RegistrationSync` record for the outbox pattern.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>

<requirements>
- A new listener class must be created that handles the `RegistrationConfirmed` event.
- The listener must be registered with NestJS's event emitter module.
- Upon receiving an event, the listener must create a corresponding `RegistrationSync` record in the database.
</requirements>

## Subtasks

- [ ] 11.1 Ensure the `EventEmitterModule` is imported in the `AppModule` (`EventEmitterModule.forRoot()`).
- [ ] 11.2 Create the `CreateRegistrationSyncOnRegistrationConfirmed` listener class in `src/application/listeners/`.
- [ ] 11.3 Implement the handler method within the listener, decorated with `@OnEvent('registration.confirmed')`.
- [ ] 11.4 The handler logic should use a repository or Prisma client to create a new `RegistrationSync` record with `status: PENDING`.
- [ ] 11.5 Register the listener as a provider in the `TournamentModule`.

## Implementation Details

### Event Listener

```typescript
// src/application/listeners/create-registration-sync-on-registration-confirmed.listener.ts (conceptual)
import { OnEvent } from '@nestjs/event-emitter';
import { RegistrationConfirmed } from 'src/domain/events/registration-confirmed.event';

@Injectable()
export class CreateRegistrationSyncOnRegistrationConfirmed {
  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('registration.confirmed')
  async handleRegistrationConfirmedEvent(event: RegistrationConfirmed) {
    await this.prisma.registrationSync.create({
      data: {
        registration_id: event.registrationId,
        status: 'PENDING',
      },
    });
  }
}
```

### Relevant Files

- `src/application/listeners/create-registration-sync-on-registration-confirmed.listener.ts`
- `src/domain/events/registration-confirmed.event.ts`
- `src/application/modules/tournament.module.ts`

## Success Criteria

- When a `RegistrationConfirmed` event is dispatched, the listener is triggered.
- A new `RegistrationSync` record is successfully created in the database with the correct `registration_id` and `PENDING` status.
- The core registration use case remains completely unaware of the `RegistrationSync` table.
