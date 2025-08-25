# Technical Specification: Individual Registration

## 1. Executive Summary

This document is the second of three specifications for the tournament feature, building upon the approved **Tournament Management** spec. It details the technical implementation for a user to register for an **individual** tournament.

The solution extends the `TournamentModule` by introducing `Registration` and `RegistrationSync` entities. It defines the use cases for requesting and canceling an individual registration, which will be handled through the existing `TournamentController`. Upon confirmation, a `registration.confirmed` event is published to RabbitMQ to decouple subsequent processes like sending notifications.

## 2. System Architecture

### 2.1. Component Overview

This spec introduces the following components to the existing `TournamentModule`:

-   **Use Cases:**
    -   `RequestIndividualRegistration`: Handles the creation of a registration for a single competitor.
    -   `CancelRegistration`: Handles the cancellation of a registration.
-   **Prisma Models:** `Registration` and `RegistrationSync` entities will be added to the `schema.prisma` file, and the `Tournament` model will be updated to include the relation.
-   **Integration:** A `RabbitMQPublisher` will be used to publish events, coordinated by the outbox pattern.

## 3. Implementation Design

### 3.1. Contracts (DTOs and Interfaces)

#### 3.1.1. Data Transfer Objects (DTOs)

```typescript
// src/infraestructure/dtos/tournament/request-individual-registration.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class RequestIndividualRegistrationDto {
  @IsString()
  @IsNotEmpty()
  tournamentId: string;

  @IsString()
  @IsNotEmpty()
  competitorId: string; // ID of the Dependant
}

// src/infraestructure/dtos/tournament/cancel-registration.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CancelRegistrationDto {
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
```

#### 3.1.2. Use Case Interfaces

```typescript
// src/application/use-cases/tournament/request-individual-registration.ts
export interface RequestIndividualRegistrationInput {
  tournamentId: string;
  competitorId: string;
  holderId: string; // ID of the User making the request
}

export interface RequestIndividualRegistrationOutput {
  registrationId: string;
  status: RegistrationStatus;
}
```

### 3.2. Data Model (Prisma Schema)

This section formally defines the `Registration` and `RegistrationSync` models and updates the `Tournament` model.

```prisma
// prisma/schema.prisma

model Tournament {
  id                    String    @id @default(uuid())
  name                  String
  description           String
  type                  TournamentType
  registrationStartDate DateTime  @map("registration_start_date")
  registrationEndDate   DateTime  @map("registration_end_date")
  startDate             DateTime  @map("start_date")
  deletedAt             DateTime? @map("deleted_at")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  // Relation is now active
  registrations         Registration[] 

  @@map("tournaments")
}

model Registration {
  id                 String             @id @default(uuid())
  tournament         Tournament         @relation(fields: [tournamentId], references: [id])
  tournamentId       String             @map("tournament_id")
  competitor         User               @relation(fields: [competitorId], references: [id])
  competitorId       String             @map("competitor_id")
  status             RegistrationStatus @map("status")
  type               RegistrationType   @map("type")

  // Duo-specific fields will be handled in the next spec
  // partnerRequest     Registration?      @relation("DuoPartner", fields: [partnerRequestId], references: [id])
  // partnerRequestId   String?            @unique @map("partner_request_id")
  // inversePartnerRequest Registration?   @relation("DuoPartner")

  sync               RegistrationSync?
  createdAt          DateTime           @default(now()) @map("created_at")
  updatedAt          DateTime           @updatedAt @map("updated_at")

  @@map("registrations")
  @@unique([tournamentId, competitorId])
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

enum RegistrationType {
  INDIVIDUAL
  // DUO_INCOMPLETE
  // DUO_COMPLETE
}

enum RegistrationStatus {
  CONFIRMED
  CANCELLED
}

enum SyncStatus {
  PENDING
  SYNCED
  FAILED
}
```

### 3.3. Business Logic

-   **RequestIndividualRegistration Use Case:**
    1.  Verify the tournament exists, is of type `INDIVIDUAL`, and is within the registration period.
    2.  Verify the `competitorId` and `holderId` are valid and linked.
    3.  Within a single database transaction, create a `Registration` record with `type: INDIVIDUAL` and `status: CONFIRMED`, and create a corresponding `RegistrationSync` record with `status: PENDING`.
    4.  If the database write fails due to the `@@unique` constraint, throw a `ConflictException` (which NestJS maps to a 409 HTTP status).
-   **CancelRegistration Use Case:**
    1.  Verify the registration exists.
    2.  Check if the user (Admin or original Holder) has permission to cancel.
    3.  Update the registration `status` to `CANCELLED`.
    4.  Publish a `registration.cancelled` event.

### 3.4. API Endpoints

-   `POST /tournaments/registrations/request-individual` (Holder): Initiate a new individual registration.
-   `POST /tournaments/registrations/:id/cancel` (Admin, Holder): Cancel a registration.

## 4. Testing Approach

-   **Unit Tests:** Cover the business logic for `RequestIndividualRegistration` and `CancelRegistration`, including all validation checks (wrong tournament type, outside registration window, etc.).
-   **E2E Tests:**
    -   Test the successful creation of an individual registration.
    -   Test the cancellation of a registration.
    -   Test failure scenarios (e.g., registering for a DUO tournament, registering after the deadline).
    -   Test the race condition by attempting to register the same competitor twice, verifying a 409 Conflict response.

## 5. Risks and Considerations

-   **Idempotency:** The `@@unique([tournamentId, competitorId])` constraint in the `Registration` model, combined with specific error handling to return a 409 status, provides robust idempotency.
-   **Atomicity:** The transactional outbox pattern (creating `Registration` and `RegistrationSync` in one DB transaction) is critical for data consistency. The actual publishing to RabbitMQ is handled by a separate worker process that reads from the `RegistrationSync` table.
-   **Outbox Worker:** A separate technical specification should be considered for the background worker that processes the `RegistrationSync` table to ensure its reliability and error handling are robust.
