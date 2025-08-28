# Technical Specification: Duo Tournament Registration

## Executive Summary

This document outlines the technical implementation for the Duo Tournament Registration feature. The solution enables two dependants from different families to register as a team through an invitation workflow. The implementation will be built upon our existing DDD/CQRS architecture within the NestJS application. Key architectural decisions include extending the `Tournament` and `Registration` aggregates to handle duo-specific logic, leveraging optimistic locking for concurrency control, and ensuring data consistency through database transactions. A `RegistrationSync` entity, acting as a transactional outbox, will be used to guarantee reliable event propagation for downstream processes.

## System Architecture

### Domain Placement

All new logic will be placed within the existing `tournament` and `registration` domain/module contexts.

-   `src/domain/entities/tournament/`: Modifications to `tournament.entity.ts`.
-   `src/domain/entities/registration/`: Modifications to `registration.entity.ts`.
-   `src/application/use-cases/tournaments/`: New use cases will be added here.
-   `src/infraestructure/controllers/`: A new or existing controller will house the new endpoints.
-   `src/infraestructure/database/prisma/`: Schema changes.

### Component Overview

-   **`Tournament` Aggregate:** Will be enhanced with a `requestDuoRegistration` method. This method will be the entry point for creating a duo registration, validating tournament rules (e.g., registration open, capacity).
-   **`Registration` Aggregate:** Will be modified to support a duo structure. It will need fields for both `competitorId` and `partnerId`, and a new `status` of `PENDING_APPROVAL`. It will also contain the logic to `accept` and `reject` invitations.
-   **Application Use Cases:** New use cases (`RequestDuoRegistration`, `GetMyPendingDuoRegistrations`, `AcceptDuoRegistration`, `RejectDuoRegistration`) will orchestrate the process, fetching aggregates, calling their methods, and saving them within a transaction.
-   **`RegistrationSync` Entity:** Used as a transactional outbox. A `RegistrationSync` record will be created in the same transaction as the `Registration`, ensuring that the `DuoRegistration.Requested` event is processed reliably.
-   **Data Flow:**
    1.  Holder A sends a `POST` request to `/tournaments/request-duo-registration`.
    2.  The `RequestDuoRegistration` use case loads the `Tournament` aggregate.
    3.  It calls `tournament.requestDuoRegistration(...)`, which validates rules and creates a new `Registration` aggregate with `PENDING_APPROVAL` status and a `partnerId`.
    4.  The use case persists the new `Registration` and a corresponding `RegistrationSync` record in a single database transaction.
    5.  Holder B `GET`s `/tournaments/my-pending-duo-registrations`.
    6.  A CQRS query fetches the pending registrations directly from the database.
    7.  Holder B `POST`s to `/registrations/{id}/accept`.
    8.  The `AcceptDuoRegistration` use case loads the `Registration` and `Tournament` aggregates.
    9.  It calls `registration.accept()`, which checks tournament capacity (via a domain service or by passing the `Tournament` aggregate). If the tournament is full, the registration is cancelled. Otherwise, the status becomes `CONFIRMED`.
    10. The use case persists the updated `Registration` and creates a `RegistrationSync` record for the `DuoRegistration.Accepted` event in a transaction.

## Implementation Design

### Core Interfaces

```typescript
// src/application/use-cases/tournaments/request-duo-registration.use-case.ts
export class RequestDuoRegistrationUseCase {
  execute(command: RequestDuoRegistrationCommand): Promise<Registration>;
}

// src/application/use-cases/tournaments/get-my-pending-duo-registrations.use-case.ts
export class GetMyPendingDuoRegistrationsUseCase {
  execute(query: GetMyPendingDuoRegistrationsQuery): Promise<GetMyPendingDuoRegistrationsListItemView[]>;
}

// src/application/use-cases/tournaments/accept-duo-registration.use-case.ts
export class AcceptDuoRegistrationUseCase {
  execute(command: AcceptDuoRegistrationCommand): Promise<void>;
}
```

### Data Models

```prisma
// prisma/schema.prisma

enum RegistrationStatus {
  CONFIRMED
  CANCELLED
  PENDING_APPROVAL // Add this
  REJECTED         // Add this
}

model Registration {
  id            String             @id @default(uuid())
  tournament_id String
  competitor_id String
  partner_id    String?            // Add this for the invited partner
  status        RegistrationStatus
  type          TournamentType
  version       Int                @default(1) // Add this for optimistic locking

  // ... existing fields and relations

  @@unique([tournament_id, competitor_id, partner_id]) // Modify unique constraint
  @@map("registrations")
}

// The RegistrationSync model already exists and is suitable.
```

### API Endpoints

-   `POST /tournaments/request-duo-registration`: Initiates a new duo registration request.
    -   Body: `{ tournamentId: string, competitorId: string, partnerId: string }`
-   `GET /tournaments/my-pending-registrations`: Returns pending registration requests for the current user's dependants.
-   `POST /registrations/:id/accept`: Accepts a pending registration.
-   `POST /registrations/:id/reject`: Rejects a pending registration.

## Impact Analysis

| Affected Component | Type of Impact | Description & Risk Level | Required Action |
| --- | --- | --- | --- |
| `prisma/schema.prisma` | Schema Change | Adds `partner_id`, `version` to `Registration`. Adds `PENDING_APPROVAL`, `REJECTED` to `RegistrationStatus` enum. Medium risk. | Coordinate migration. Ensure existing individual registrations are not affected. |
| `Registration` Aggregate | Domain Logic Change | Will be significantly modified to handle duo logic, statuses, and partner concepts. High risk. | Extensive unit tests are required for all state transitions. |
| `Tournament` Aggregate | Domain Logic Change | Adds `requestDuoRegistration` method and needs to check capacity considering pending duo requests. Medium risk. | Unit test new method and its interaction with `Registration`. |
| `registrations` DB table | Data Change | New columns will be added. Existing rows will have `null` for `partner_id` and a default `version`. | Backfill `version` for existing rows if necessary. |


## Testing Approach

### Unit Tests

-   `Tournament` aggregate: Test `requestDuoRegistration` for all business rules (tournament full, registration closed, invalid partner, etc.).
-   `Registration` aggregate: Test `accept` and `reject` methods, including the case where acceptance fails due to the tournament being full (leading to `CANCELLED` status). Test all state transitions.
-   Use Cases: Mock repositories and test that they correctly fetch aggregates, call their methods, and save the results within a transaction.

### Integration Tests

-   Create a full E2E test (`/test/tournament/duo-registration.e2e-spec.ts`) covering the entire happy path: request -> get pending -> accept.
-   Create E2E tests for all failure scenarios: rejecting a request, trying to accept a request for a full tournament.
-   Crucially, create an E2E test to simulate the "last spot" race condition to verify that optimistic locking correctly prevents over-booking and returns a conflict error.

## Development Sequencing

### Build Order

1.  **Schema & Domain Models:** Implement the Prisma schema changes and run the migration. Update the `Registration` and `Tournament` aggregate entities with the new fields and methods (TDD approach).
2.  **Request Workflow:** Implement the `RequestDuoRegistration` use case and its corresponding API endpoint. Implement the transactional outbox logic for this step.
3.  **Retrieval Workflow:** Implement the `GetMyPendingDuoRegistrations` CQRS query and its API endpoint.
4.  **Approval/Rejection Workflow:** Implement the `AcceptDuoRegistration` and `RejectDuoRegistration` use cases and their API endpoints.
5.  **E2E Testing:** Implement the comprehensive E2E tests described above.

### Technical Dependencies

-   None. All dependencies are internal to the project.

## Monitoring & Observability

### Metrics

-   `duo_registrations_requested_total`: Counter for initiated requests.
-   `duo_registrations_approved_total`: Counter for accepted requests.
-   `duo_registrations_rejected_total`: Counter for rejected requests.
-   `duo_registrations_cancelled_by_system_total`: Counter for requests cancelled due to lack of capacity.
-   `optimistic_lock_errors_total`: Counter for concurrency errors.

### Logs

-   Log at `INFO` level for every state change of a registration.
-   Log at `WARN` level for optimistic lock failures.
-   Log at `ERROR` level for transaction failures or unexpected errors in the use cases.

## Technical Considerations

### Key Decisions

-   Registration logic will be encapsulated within the `Tournament` and `Registration` aggregate roots to align with DDD.
-   Concurrency will be handled via optimistic locking on the `Registration` aggregate.
-   Eventual consistency for read models and external systems will be managed via the existing `RegistrationSync` entity, which will act as a transactional outbox.

### Known Risks

-   The complexity of the `accept` logic, which needs to check tournament capacity transactionally, is high. This requires careful implementation to avoid race conditions.
-   The migration of the `Registration` table needs to be handled carefully to avoid downtime or data integrity issues.

### Standards Compliance

-   The solution will adhere to the existing DDD/CQRS patterns.
-   All new code will be covered by unit and E2E tests.
-   Error handling will follow project conventions.
