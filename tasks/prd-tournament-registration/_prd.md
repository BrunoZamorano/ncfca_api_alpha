---
title: Tournament Registration
status: Draft
author: Gemini
stakeholders: Product, Engineering
last_updated: 2025-08-22
---

## 1. Introduction & Problem Statement

### 1.1. Problem

Currently, Brazilian debate students (represented by their parents/guardians, the "Holders") lack a centralized and simplified channel to discover and register for online debate tournaments hosted in the US. The process is fragmented, often manual, and requires parents to navigate multiple external systems, creating friction and leading to missed participation opportunities.

### 1.2. Proposed Solution

This document proposes the creation of a new feature within the NCFCA platform called **"Tournament Registration"**. This feature will allow Administrators to register online tournaments and enable Holders to register their competitors directly and intuitively. The system will manage both individual and duo registrations (with a "handshake" confirmation flow) and will integrate asynchronously with external tournament systems via a message queue (RabbitMQ), ensuring scalability and resilience.

## 2. Goals & Success Metrics

### 2.1. Goals

- **G1:** To simplify and centralize the tournament registration process for Holders and their competitors.
- **G2:** To create a robust and scalable data integration point with partner tournament platforms.
- **G3:** To increase user engagement on the platform by offering new participation opportunities.

### 2.2. Success Metrics (SMART)

- **M1 (Adoption):** Process a minimum of 50 registrations (individual or duo) through the system within the first 3 months post-launch.
- **M2 (Efficiency):** Achieve a "handshake" confirmation success rate for duo registrations greater than 90%.
- **M3 (Reliability):** Maintain a registration synchronization success rate with the external system (status `SYNCED`) greater than 99.5%.

## 3. User Personas & Stories

### 3.1. Personas

- **Administrator:** Responsible for managing the platform's content.
- **Holder (Parent/Guardian):** Manages the family account and the activities of their competitors.
- **Competitor (Student):** The end participant in the tournament.

### 3.2. User Stories

- **Admin:**
  - As an Admin, I want to **create, edit, view, and delete** tournaments to keep the list up-to-date.
  - As an Admin, I want to **view the list of registered participants** for each tournament, with their statuses, to monitor participation.
  - As an Admin, I want to be able to **cancel a registration** to manage exceptional cases.

- **Holder:**
  - As a Holder, I want to **see a list of available tournaments** with filters (name, date, type) to find the most suitable one for my child.
  - As a Holder, I want to **register my competitor in an individual tournament** quickly.
  - As a Holder, I want to **initiate a duo registration** by providing the partner competitor's email.
  - As a Holder, I want to **be notified** when my competitor is invited to a duo, so I can approve the registration.
  - As a Holder, I want to **see the updated status** of my registrations (e.g., `PENDING_CONFIRMATION`, `CONFIRMED`).
  - As a Holder, I want to be able to **cancel a registration** before the deadline.

- **Error Scenarios:**
  - As a Holder, if I enter an invalid email for a duo partner, I want to receive a **clear and immediate error message**.
  - As an Admin, if a registration fails to sync with the external system after several retries, I want it to be **marked with a `FAILED` status** for manual investigation.

## 4. Functional Requirements & System Design

### 4.1. Functional Requirements

- **FR-ADM-01:** The system **MUST** provide a secure interface for Admins to perform CRUD operations on `Tournaments`.
- **FR-ADM-02:** The `Tournament` entity **MUST** contain the fields: `name`, `applyStartDate`, `applyDeadline`, `startDate`, `description`, `type` (Enum: `INDIVIDUAL`, `DUO`).
- **FR-USR-01:** A new "Tournaments" section **MUST** be accessible in the main menu for authenticated Holders.
- **FR-USR-02:** Individual registrations **MUST** generate a `Registration` record with the status `CONFIRMED`.
- **FR-USR-03:** Initiating a duo registration **MUST** generate two `Registration` records (one for each participant) with the status `PENDING_CONFIRMATION`.
- **FR-USR-04:** Confirmation by the second Holder **MUST** update the status of both records to `CONFIRMED`.
- **FR-SYS-01:** Once a registration reaches the `CONFIRMED` status, an event **MUST** be published to the integration queue.

### 4.2. State Machines

- **Registration Status (`registrationStatus`):**
  - `PENDING_CONFIRMATION` -> `CONFIRMED` -> `CANCELLED`
  - *Note: Individual registrations start directly in the `CONFIRMED` state.*
- **Synchronization Status (`syncStatus`):**
  - `PENDING` -> `SYNCED` | `FAILED`

### 4.3. Diagrams

*Sequence diagrams for the "Duo Handshake" and "Registration Synchronization" flows will be created during the technical design phase.*

## 5. Non-Functional Requirements (NFRs)

- **NFR-PERF-01 (Latency):** The tournament listing and viewing APIs **MUST** respond in under 500ms (95th percentile).
- **NFR-SCALE-01 (Scalability):** The system **MUST** support a peak load of 100 registration submissions per minute.
- **NFR-RELI-01 (Reliability):** The registration service **MUST** maintain 99.9% uptime.

## 6. Integration & Service Contracts

### 6.1. RabbitMQ: Integration Contract

- **Event:** `registration.confirmed`
- **Payload (JSON):**
  ```json
  {
    "registrationId": "string",
    "tournamentId": "string",
    "isDuo": "boolean",
    "participants": [
      {
        "competitorId": "string",
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "holderAddress": {
          "street": "string",
          "number": "string",
          "neighborhood": "string",
          "city": "string",
          "state": "string",
          "zipCode": "string"
        }
      }
    ]
  }
  ```
- **Retry Policy:** The publisher will attempt to resend the message 3 times with exponential backoff in case of failure. After the 3rd failure, the registration's `syncStatus` will be set to `FAILED`.
- **DLQ Strategy:** Messages that permanently fail will be sent to a Dead-Letter Queue (`registration.dlq`) for manual analysis.

### 6.2. Email Service: Notification Contract

- **Interface:** `EmailService.send(templateId: string, recipientEmail: string, params: object)`
- **Template ID:** `DUO_INVITATION`
- **Compliance:** All transactional emails **MUST** include an unsubscribe link and comply with GDPR/LGPD.

## 7. Constraints & Non-Goals

### 7.1. Constraints

- All tournaments registered in this version are exclusively **online**.

### 7.2. Non-Goals (Out of Scope for v1)

- There will be **NO** payment processing for registrations.
- The **implementation** of the `EmailService` (SMTP server, etc.) is out of scope; only its interface will be defined and used.
- There will be **NO** management of tournament spots, waitlists, or schedule conflicts.

## 8. Assumptions & Dependencies

- **Dependency:** A RabbitMQ instance is configured and accessible to the application environment.
- **Dependency:** An external consumer system (the tournament's external API) exists and will process messages from the integration queue.
- **Assumption:** Holders will correctly provide the partner competitors' emails for duo registrations.
