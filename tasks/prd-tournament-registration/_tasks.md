# [Tournament Registration] Implementation Task Summary

---

## Episode I: Tournament Management

This task list covers the implementation of the **Tournament Management** feature, which includes all administrative functionalities for creating, reading, updating, and deleting tournaments.

### Tasks (Episode I)

- [x] 1.0 Foundation & Data Model
- [x] 2.0 Domain Layer Implementation
- [x] 3.0 Application Layer: Write Operations
- [x] 4.0 Application Layer: Read Operations
- [x] 5.0 Infrastructure Layer & API Endpoints
- [x] 6.0 End-to-End Testing

---

## Episode II: Individual Registration

This task list covers the implementation for a user to register for an **individual** tournament.

### Relevant Files (Episode II)

- `prisma/migrations/.../migration.sql` - Database schema for new tables, including the `version` column.
- `src/domain/entities/tournament/tournament.entity.ts` - The Tournament aggregate root.
- `src/domain/entities/registration/registration.entity.ts` - The core domain entity for a registration.
- `src/domain/events/registration-confirmed.event.ts` - The domain event for a confirmed registration.
- `src/application/use-cases/tournament/request-individual-registration.use-case.ts` - Use case for creating a registration.
- `src/application/listeners/create-registration-sync-on-registration-confirmed.listener.ts` - Listener to handle the outbox pattern side-effect.
- `src/infraestructure/controllers/tournament/tournament.controller.ts` - Controller to expose new endpoints.
- `src/infraestructure/dtos/tournament/request-individual-registration.dto.ts` - DTO for the registration request.
- `src/application/modules/tournament.module.ts` - Module configuration for events and RabbitMQ integration.
- `src/infraestructure/listeners/tournament.listener.ts` - Temporary worker to process outbox events.
- `test/tournament/individual-registration.e2e-spec.ts` - E2E tests for the feature.

### Tasks (Episode II)

- [ ] 7.0 Database: Add Registration Schema & Optimistic Locking
- [ ] 8.0 Domain Layer: Implement Tournament Aggregate Root
- [ ] 9.0 Application Layer: Implement Registration Use Cases
- [ ] 10.0 Infrastructure Layer: Expose Registration API Endpoints
- [ ] 11.0 Application Layer: Handle Domain Events
- [ ] 12.0 Integration: Configure RabbitMQ Publisher & Worker
- [ ] 13.0 Tests: Implement E2E Tests for Individual Registration
