# Technical Specification: Duo Registration

## 1. Executive Summary

This is the final of three specifications for the tournament feature. It builds upon the **Tournament Management** and **Individual Registration** specs to detail the technical implementation for **Duo Registration**. 

This solution focuses on the "handshake" mechanism, where one competitor initiates a registration and invites a partner, who must then confirm to complete the registration. This is managed by extending the `Registration` model with a self-relation and defining a state machine governed by the `RegistrationStatus` and `RegistrationType` enums. New use cases and endpoints are introduced to handle the request and confirmation flows.

## 2. System Architecture

### 2.1. Component Overview

This spec adds the following components to the `TournamentModule`:

-   **Use Cases:**
    -   `RequestDuoRegistration`: Handles the initial registration request and invitation.
    -   `ConfirmDuoRegistration`: Handles the partner's confirmation, completing the handshake.
-   **Prisma Model Updates:** The `Registration` model will be updated to enable linking between partner registrations. The `RegistrationType` and `RegistrationStatus` enums will be expanded.
-   **Integration:** An `EmailService` will be triggered to send an invitation to the partner.

## 3. Implementation Design

### 3.1. Contracts (DTOs and Interfaces)

#### 3.1.1. Data Transfer Objects (DTOs)

```typescript
// src/infraestructure/dtos/tournament/request-duo-registration.dto.ts
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class RequestDuoRegistrationDto {
  @IsString()
  @IsNotEmpty()
  tournamentId: string;

  @IsString()
  @IsNotEmpty()
  competitorId: string; // ID of the initiating Dependant

  @IsEmail()
  @IsNotEmpty()
  partnerEmail: string; // Email of the partner Dependant being invited
}

// src/infraestructure/dtos/tournament/confirm-duo-registration.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmDuoRegistrationDto {
  @IsString()
  @IsNotEmpty()
  registrationId: string; // The partner's registration ID to be confirmed
}
```

### 3.2. Data Model (Prisma Schema)

This section updates the `Registration` model to support duo linking and expands the enums.

```prisma
// prisma/schema.prisma

model Registration {
  id                 String             @id @default(uuid())
  tournament         Tournament         @relation(fields: [tournamentId], references: [id])
  tournamentId       String             @map("tournament_id")
  competitor         User               @relation(fields: [competitorId], references: [id])
  competitorId       String             @map("competitor_id")
  status             RegistrationStatus @map("status")
  type               RegistrationType   @map("type")

  // Duo-specific fields are now active
  partnerRequest     Registration?      @relation("DuoPartner", fields: [partnerRequestId], references: [id])
  partnerRequestId   String?            @unique @map("partner_request_id")
  inversePartnerRequest Registration?   @relation("DuoPartner")

  sync               RegistrationSync?
  createdAt          DateTime           @default(now()) @map("created_at")
  updatedAt          DateTime           @updatedAt @map("updated_at")

  @@map("registrations")
  @@unique([tournamentId, competitorId])
}

enum RegistrationType {
  INDIVIDUAL
  DUO_INCOMPLETE
  DUO_COMPLETE
}

enum RegistrationStatus {
  PENDING_CONFIRMATION // For the invited partner
  AWAITING_PARTNER     // For the initiator
  CONFIRMED
  CANCELLED
}
```

### 3.3. Business Logic (State Machine)

-   **RequestDuoRegistration Use Case:**
    1.  Validate tournament exists, is type `DUO`, and is open for registration.
    2.  Find the invited partner `User` by `partnerEmail`.
    3.  Create two `Registration` records within a transaction:
        -   **Initiator's Registration:** `type: DUO_INCOMPLETE`, `status: AWAITING_PARTNER`.
        -   **Partner's Registration:** `type: DUO_INCOMPLETE`, `status: PENDING_CONFIRMATION`.
    4.  Link the two records using the `partnerRequestId` field.
    5.  Trigger an invitation email to the partner's holder.

-   **ConfirmDuoRegistration Use Case:**
    1.  The confirming user must be the holder of the invited partner.
    2.  Find the partner's `Registration` record by `registrationId`. It must have `status: PENDING_CONFIRMATION`.
    3.  Find the initiator's linked registration record.
    4.  Within a transaction, update both records:
        -   Set `status` to `CONFIRMED`.
        -   Set `type` to `DUO_COMPLETE`.
    5.  Create `RegistrationSync` records for both registrations to trigger `registration.confirmed` events.

### 3.4. API Endpoints

-   `POST /tournaments/registrations/request-duo` (Holder): Initiate a duo registration and invite a partner.
-   `POST /tournaments/registrations/confirm-duo` (Holder): Confirm a duo invitation.

## 4. Testing Approach

-   **Unit Tests:** Cover the state transitions and validation logic for both `RequestDuoRegistration` and `ConfirmDuoRegistration` use cases.
-   **E2E Tests:**
    -   Test the full, successful handshake flow.
    -   Test cancellation by the initiator before confirmation.
    -   Test cancellation by the invited partner (declining).
    -   Test attempting to confirm a registration that doesn't exist or is already confirmed.
    -   Test that a non-holder of the invited partner cannot confirm.

## 5. Risks and Considerations

-   **Orphaned Registrations:** This is the primary risk. If a partner never confirms, two `Registration` records are left in an incomplete state. **Mitigation:** A scheduled job should be implemented post-v1 to clean up incomplete registrations that are past the tournament's `registrationEndDate`.
-   **Concurrency:** A user could be invited to two different duos for the same tournament. The `@@unique([tournamentId, competitorId])` constraint prevents the creation of the second invitation, which is the desired behavior. The API should return a 409 Conflict in this case.
-   **Abuse:** To prevent spam, rate limiting should be considered for the `request-duo` endpoint on a per-holder basis.
