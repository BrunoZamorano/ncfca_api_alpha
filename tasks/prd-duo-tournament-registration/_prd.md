# Product Requirements Document (PRD): Duo Tournament Registration

## Overview

This document outlines the requirements for the "Duo Tournament Registration" feature. Currently, the NCFCA platform supports individual tournament registrations. To expand our offerings, especially for international users, we need to enable two dependants, managed by different account Holders, to register as a team (a duo). This feature introduces an invitation-based workflow where one Holder initiates a registration request, and the partner's Holder must approve it to complete the registration. This process will be integrated into our existing tournament management system.

## Goals

1.  **Enable Duo Registrations:** Allow a Holder to initiate a tournament registration for their dependant and invite another dependant (by email) to be their partner.
2.  **Implement an Approval Workflow:** Create a process where the invited partner's Holder receives a pending request which they can either accept or reject.
3.  **Ensure System Integrity:** The registration process must be robust, handle concurrent requests safely using optimistic locking, and guarantee data consistency through transactions.
4.  **Maintain Standards:** The implementation must adhere to all established project architecture patterns (DDD, CQRS), coding standards, and testing practices.

## User Stories

-   **As a Holder (Requester),** I want to select one of my dependants for a tournament, invite a partner for them by providing the partner's name and email, and submit a duo registration request so that they can compete as a team.
-   **As a Holder (Approver),** I want to see a list of pending duo registration requests for my dependants, review the details (tournament, partner), and choose to either accept or reject the invitation to finalize the registration status.

## Core Features

### 1. Request Duo Registration
-   **Description:** A Holder can fill out a form to request a duo registration.
-   **Requirements:**
    -   R1: The system must allow the Holder to select one of their own dependants.
    -   R2: The system must require the Holder to input the email (the backend will receive the id, instead of the email, but the person won't know the id, but the email) of the intended partner.
    -   R3: Upon submission, the system shall create a `Registration` entity with a `PENDING_APPROVAL` status.
    -   R4: The system must emit a `DuoRegistration.Requested` domain event.

### 2. View Pending Duo Registrations
-   **Description:** A Holder can view all incoming duo registration requests for their dependants.
-   **Requirements:**
    -   R5: The system must provide an endpoint that returns a list of all registrations where one of the Holder's dependants is the invited partner and the status is `PENDING_APPROVAL`.
    -   R6: The returned information must include tournament name, the requesting dependant's name, and the date of the request.

### 3. Approve/Reject Duo Registration
-   **Description:** A Holder can act upon a pending duo registration request.
-   **Requirements:**
    -   R7: The system must allow the approver to accept a pending request. Upon acceptance, the registration status changes to `CONFIRMED` and a `DuoRegistration.Accepted` event is emitted.
    -   R8: The system must allow the approver to reject a pending request. Upon rejection, the registration status changes to `REJECTED` and a `DuoRegistration.Rejected` event is emitted.

## User Experience

-   The user interface will be built using our `shadcn-ui` component library.
-   The flow for requesting and managing invitations must be intuitive.
-   All error messages and system feedback directed to the user must be in clear and concise Portuguese.

## High-Level Technical Constraints

-   **Architecture:** Must adhere to the existing NestJS project structure, utilizing Domain-Driven Design (DDD) and CQRS patterns.
-   **Database:** The `schema.prisma` will be extended. The `Registration` aggregate must include a `version` column to implement optimistic locking for handling concurrent updates.
-   **API:** Endpoints must use only `GET` and `POST` verbs with meaningful, action-oriented names (e.g., `/tournaments/request-duo-registration`).
-   **Event-Driven:** Domain events must be published reliably. The implementation should use a robust pattern like the transactional outbox to ensure at-least-once event delivery.

## Authorization
-   **Request Duo Registration:** Any authenticated Holder.
-   **View Pending Requests:** Only the Holder of the invited dependant.
-   **Accept/Reject Request:** Only the Holder of the invited dependant.
-   **View All Registrations:** System Administrators.

## Non-Goals (Out of Scope)

-   An automated email or push notification system for pending requests. The current scope only includes the API to query for pending items.
-   A flow to invite users who are not already dependants on the platform.
-   Specific performance optimization beyond using CQRS queries for data retrieval.

## Phased Rollout Plan

The feature will be developed and released in logical phases, following a strict test-driven approach.

-   **Phase 1: Duo Registration Request:**
    1.  Update `schema.prisma` and domain entities (`Tournament`, `Registration`) to support duo types and optimistic locking.
    2.  Implement the domain logic (`duoRegister` method) with unit tests.
    3.  Implement the `RequestDuoRegistration` use case and its tests.
    4.  Add the `POST` endpoint and create E2E tests, including for concurrency scenarios.
    5.  Integrate a transactional outbox pattern for event publishing.

-   **Phase 2: Pending Registration Retrieval:**
    1.  Implement the CQRS query to fetch pending requests for a Holder.
    2.  Implement the `GetMyPendingRegistrationRequests` use case and its tests.
    3.  Add the `GET` endpoint and create E2E tests.

-   **Phase 3: Registration Confirmation & Rejection:**
    1.  Implement the domain logic (`acceptDuoRequest`, `rejectDuoRequest`) with unit tests.
    2.  Implement the corresponding use cases and their tests.
    3.  Add the `POST` endpoints for both actions and create E2E tests.
    4.  Create domain event listeners to handle side-effects from the `Accepted` and `Rejected` events.

## Success Metrics

-   **Functional:** A Holder can successfully complete the full workflow: request a duo registration, have the partner's Holder view it, and have it be successfully accepted/rejected.
-   **Technical:** All new unit and E2E tests are passing. Code coverage meets project standards.
-   **Architectural:** Domain events for `Requested`, `Accepted`, and `Rejected` are correctly emitted and handled. The implementation follows all project standards and patterns.

## Risks and Mitigations

-   **Risk:** Race conditions when multiple users try to register for the last spot in a tournament.
    -   **Mitigation:** Implement optimistic locking using a `version` field on the `Registration` aggregate. The service layer will be responsible for catching version mismatch errors and providing appropriate user feedback.
-   **Risk:** Inconsistent data state if an operation fails midway.
    -   **Mitigation:** Use database transactions (`prisma.$transaction`) to wrap all multi-step database operations, ensuring atomicity.
-   **Risk:** Event listeners fail, causing downstream processes (like data sync) to be missed.
    -   **Mitigation:** Implement the transactional outbox pattern to guarantee at-least-once delivery of all domain events to the message broker.

## Edge Cases to Handle

The system must gracefully handle and provide clear Portuguese error messages for the following scenarios:
-   A user invites a partner who is already registered for the tournament.
-   A user invites their own dependant as a partner.
-   A registration is approved after the tournament has reached maximum capacity.
-   A registration is requested or approved after the tournament's registration period has closed.
-   A user sends a duplicate invitation to the same partner for the same tournament.
-   A user invites a partner who already has a pending invitation from someone else for the same tournament.
-   A user withdraws a pending request (Note: this implies a "cancel" action may be needed).
-   A tournament is cancelled while a request is pending.

## Open Questions

-   Should a Holder be able to cancel a pending request they sent? The edge case "user withdraws a pending request" implies this functionality. This will be considered for a fast-follow enhancement if not in the initial MVP.
