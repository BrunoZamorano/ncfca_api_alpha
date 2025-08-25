# Technical Specification: Tournament Registration

## Executive Summary

This document outlines the technical implementation for the **Tournament Registration** feature. The solution introduces a new `TournamentModule` within the existing NestJS architecture to handle all logic related to tournament and registration management. The implementation leverages Prisma to introduce `Tournament`, `Registration`, and `RegistrationSync` entities to store tournament information, track participant registrations, and manage the state of external synchronization.

The most challenging aspect of the feature is the "duo registration handshake," which will be managed through a state machine within the `Registration` entity and orchestrated by dedicated use cases. Asynchronous communication with external systems is handled by publishing events to a RabbitMQ queue upon successful registration confirmation. This approach ensures loose coupling and high resilience, aligning with the platform's existing event-driven patterns.

## System Architecture

### Domain Placement

All new components related to this feature will be located within a new, self-contained module:

-   `src/application/use-cases/tournament/`: For all tournament-related use cases.
-   `src/infraestructure/controllers/tournament/`: For the API controller and listeners.
-   `src/infraestructure/database/prisma/repositories/tournament/`: For the repository implementations.
-   `src/domain/entities/tournament.entity.ts`
-   `src/domain/entities/registration.entity.ts`
-   `src/domain/entities/registration-sync.entity.ts`

### Component Overview

-   **TournamentModule:** A new NestJS module that encapsulates all components of this feature.
-   **TournamentController:** A single controller exposing secured endpoints for both Admin and Holder users, using `@UseGuards` and role-based decorators to manage access.
-   **TournamentListener:** A listener for asynchronous events related to tournaments.
-   **Use Cases:**
    -   `CreateTournament`: Handles the creation of new tournaments.
    -   `UpdateTournament`: Handles updates to existing tournaments.
    -   `DeleteTournament`: Handles the logical deletion of tournaments.
    -   `GetTournament`: Fetches a single tournament by its ID.
    -   `ListTournaments`: Fetches and filters available tournaments based on search parameters.
    -   `RequestRegistration`: Handles both individual and duo registration initiation.
    -   `ConfirmDuoRegistration`: Manages the "handshake" confirmation from the partner.
    -   `CancelRegistration`: Allows Admins or Holders to cancel a registration.
    -   `SyncRegistration`: Handles the logic for syncing a registration with external systems, triggered by the listener.
-   **Prisma Models:** `Tournament`, `Registration`, and `RegistrationSync` entities will be added to the `schema.prisma` file.
-   **RabbitMQPublisher:** A service responsible for publishing the `registration.confirmed` event.

## Implementation Design

### Core Interfaces (Use Cases)

```typescript
// src/application/use-cases/tournament/request-registration.ts

@comment: forget the idea of core. we must have a complete document. put all interfaces and create another section for dtos.
export interface RequestRegistrationInput {
    TournamentId: string;
    CompetitorId: string;
    HolderId: string;
    PartnerCompetitorEmail?: string; // Required for duo registrations
    Type: RegistrationType;
}

// src/application/use-cases/tournament/confirm-duo-registration.ts
export interface ConfirmDuoRegistrationInput {
  @comment: the interfaces must be in camelCase. 
    InitialRegistrationId: string; // The ID of the registration being confirmed
    PartnerRegistrationId: string; // The ID of the partner's registration
}
```

### Data Models (Prisma Schema)

```prisma
// prisma/schema.prisma

// The @@map("table_name") directive maps the Prisma model name (e.g., Tournament)
// to a specific table name in the database (e.g., tournaments), allowing for different naming conventions.

model Tournament {
  id                    String         @id @default(uuid())
  name                  String
  registrationStartDate DateTime       @map("registration_start_date")
  registrationEndDate   DateTime       @map("registration_end_date")
  startDate             DateTime       @map("start_date")
  description           String
  type                  TournamentType
  deletedAt             DateTime?      @map("deleted_at") // For logical deletion
  registrations         Registration[]
  createdAt             DateTime       @default(now()) @map("created_at")
  updatedAt             DateTime       @updatedAt @map("updated_at")

  @@map("tournaments")
}

model Registration {
  id                 String             @id @default(uuid())
  tournament         Tournament         @relation(fields: [tournamentId], references: [id])
  tournamentId       String             @map("tournament_id")
  competitor         User               @relation(fields: [competitorId], references: [id])
  competitorId       String             @map("competitor_id")
  status             RegistrationStatus @default(PENDING_CONFIRMATION) @map("status")
  type               RegistrationType

  partnerRequest     Registration?      @relation("DuoPartner", fields: [partnerRequestId], references: [id])
  partnerRequestId   String?            @unique @map("partner_request_id")
  inversePartnerRequest Registration?   @relation("DuoPartner")

  sync               RegistrationSync?
  createdAt          DateTime           @default(now()) @map("created_at")
  updatedAt          DateTime           @updatedAt @map("updated_at")

  @@map("registrations")
}

model RegistrationSync {
  id             String       @id @default(uuid())
  registration   Registration @relation(fields: [registrationId], references: [id])
  registrationId String       @unique @map("registration_id")
  status         SyncStatus   @default(PENDING)
  attempts       Int          @default(0)
  lastAttemptAt  DateTime?    @map("last_attempt_at")
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  @@map("registration_syncs")
}

enum TournamentType {
  INDIVIDUAL
  DUO
}

enum RegistrationType {
  INDIVIDUAL
  DUO_INCOMPLETE
  DUO_COMPLETE
}

enum RegistrationStatus {
  PENDING_CONFIRMATION
  CONFIRMED
  CANCELLED
}

enum SyncStatus {
  PENDING
  SYNCED
  FAILED
}
```

### API Endpoints

All endpoints are consolidated into a single `TournamentController`.

-   `POST /tournaments/create` (Admin): Create a new tournament.
-   `POST /tournaments/:id/update` (Admin): Update a tournament.
-   `POST /tournaments/:id/delete` (Admin): Logically delete a tournament.
-   `GET /tournaments` (Admin, Holder): List tournaments with filters.
-   `GET /tournaments/:id` (Admin, Holder): Get a single tournament.
-   `GET /tournaments/:id/registrations` (Admin): View registrations for a tournament.
-   `POST /tournaments/registrations/request` (Holder): Initiate a new individual or duo registration.
-   `POST /tournaments/registrations/confirm` (Holder): Confirm a duo registration invitation.
-   `POST /tournaments/registrations/:id/cancel` (Admin, Holder): Cancel a registration.

## Integration Points

-   **RabbitMQ:**
    -   **Service:** `RabbitMQPublisher`
    -   **Event:** `registration.confirmed`
    -   **Payload:** As defined in the PRD.
    -   **Error Handling:** The publisher will implement a retry mechanism with exponential backoff. If all retries fail, the `RegistrationSync` status will be updated to `FAILED`.
-   **Email Service:**
    -   **Interface:** `EmailService`
    -   **Trigger:** Listens for the `registration.confirmed` event.
    -   **Action:** Sends a confirmation email for all registration types (Individual and Duo).
    -   **Template:** `REGISTRATION_CONFIRMED`.

## Impact Analysis

| Affected Component | Type of Impact | Description & Risk Level | Required Action |
| --- | --- | --- | --- |
| `User` DB table | Schema Change | Adds `registrations` relation. Low risk. | Run Prisma migration. |
| `AppModule` | Code Change | Import and configure the new `TournamentModule`. Low risk. | Update `app.module.ts`. |
| RabbitMQ Infra | Configuration | May require new queue/exchange (`registration.dlq`). Low risk. | DevOps to confirm configuration. |

## Testing Approach

-   **Unit Tests:** A unit test will be created for every use case to ensure business logic is correctly implemented.
-   **E2E Tests (`/test` directory):** An E2E test will be created for every API endpoint to validate the entire request/response flow, including authentication and authorization, as specified in the project's testing standards.

## Development Sequencing

1.  **Data Model:** Implement the `Tournament`, `Registration`, and `RegistrationSync` models in `schema.prisma` and run the migration.
2.  **Tournament Module:** Implement all use cases and the controller within the `TournamentModule`, using `@UseGuards` for authorization.
3.  **Core Registration Logic:** Implement `RequestRegistration` and `ConfirmDuoRegistration`. This is the most complex part.
4.  **Integration:** Implement the RabbitMQ publisher and the email notification listener.
5.  **Testing:** Write unit and E2E tests in parallel with development.

## Monitoring & Observability

-   **Metrics:**
    -   `registrations_initiated_total{type="individual|duo"}`: Counter for new registrations.
    -   `registrations_confirmed_total{type="duo"}`: Counter for successful duo handshakes.
    -   `registrations_sync_status_total{status="synced|failed"}`: Counter for integration outcomes.
-   **Logs:**
    -   Log errors during the registration process with `ERROR` level.
    -   Log key steps in the duo handshake flow with `INFO` level for traceability.
    -   **Alerts:** Configure an alert for a high number of messages in the `registration.dlq`.

## Technical Considerations

### Key Decisions

-   **Duo Linking:** Using a self-relation (`partnerRequestId`) in the `Registration` model was chosen for simplicity over a separate linking table. This keeps the data model flatter for this specific use case.
-   **Idempotency:** A unique constraint on (`tournament_id`, `competitor_id`) in the `registrations` table will be enforced to prevent duplicate registrations for the same competitor in the same tournament.

### Known Risks

-   **Orphaned Invitations:** Duo invitations that are never accepted will result in `Registration` records with a permanent `PENDING_CONFIRMATION` status. **Mitigation:** While a cleanup job is out of scope for v1, the `registrationEndDate` on the tournament can be used by support staff to identify old, pending ones. A backlog task should be created to implement an automated cleanup job.
-   **Email Deliverability:** The success of the duo handshake depends on the email notification being delivered and seen. **Mitigation:** This is an accepted risk. The `EmailService` is a separate concern, but its reliability is a dependency.

### Standards Compliance

-   The implementation will adhere to the existing project architecture (NestJS modules, SOLID, Clean Architecture).
-   All code will be formatted with Prettier and linted with ESLint as per project configuration.
-   All tests will follow the structure and conventions found in the `/test` directory.