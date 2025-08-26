---
status: pending
---

<task_context>
<domain>infrastructure/integration</domain>
<type>implementation</type>
<scope>integration</scope>
<complexity>medium</complexity>
<dependencies>task:11.0</dependencies>
</task_context>

# Task 12.0: Integration: Configure RabbitMQ Publisher & Worker

## Overview

This task connects our application to the wider ecosystem by publishing integration events to RabbitMQ. It also includes the temporary worker that consumes these events, completing the outbox pattern loop for this feature.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>

<requirements>
- A listener must be created to subscribe to the domain event and publish a message to RabbitMQ.
- A temporary worker (listener) must be created to consume messages from RabbitMQ.
- The RabbitMQ client must be configured in the `TournamentModule`.
</requirements>

## Subtasks

- [ ] 12.1 Configure the `ClientsModule` for RabbitMQ in `src/application/modules/tournament.module.ts`.
- [ ] 12.2 Create a new listener, `PublishIntegrationEventOnRegistrationConfirmed`, that listens for the `RegistrationConfirmed` domain event.
- [ ] 12.3 Inject the `ClientProxy` into this new listener and use it to `emit()` the `registration.confirmed` integration event to the `tournaments_queue`.
- [ ] 12.4 Create the temporary `TournamentListener` class in `src/infraestructure/listeners/tournament.listener.ts`.
- [ ] 12.5 Implement a method in `TournamentListener` decorated with `@EventPattern('registration.confirmed')` from `@nestjs/microservices` to consume from the queue.
- [ ] 12.6 The consumer logic should update the `RegistrationSync` record's status to `SYNCED`.

## Implementation Details

This task involves two parts: publishing and consuming. Publishing is triggered by our internal domain event, while consuming is handled by NestJS's microservice capabilities.

### RabbitMQ Publisher Listener

```typescript
// In a new listener file, e.g., publish-integration-event.listener.ts
@Injectable()
export class PublishIntegrationEventOnRegistrationConfirmed {
  constructor(@Inject('TOURNAMENT_SERVICE') private readonly client: ClientProxy) {}

  @OnEvent('registration.confirmed')
  handleDomainEvent(event: RegistrationConfirmed) {
    this.client.emit('registration.confirmed', { registrationId: event.registrationId });
  }
}
```

### Relevant Files

- `src/application/modules/tournament.module.ts`
- `src/application/listeners/publish-integration-event.listener.ts`
- `src/infraestructure/listeners/tournament.listener.ts`

## Success Criteria

- A message is successfully published to the `tournaments_queue` when a registration is confirmed.
- The temporary worker consumes the message from the queue.
- The corresponding `RegistrationSync` record is updated to `SYNCED`.
