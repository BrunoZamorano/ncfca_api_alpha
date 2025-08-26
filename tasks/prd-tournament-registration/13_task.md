---
status: pending
---

<task_context>
<domain>testing/e2e</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>task:10.0, task:12.0</dependencies>
</task_context>

# Task 13.0: Tests: Implement E2E Tests for Individual Registration

## Overview

This final task is to create end-to-end (E2E) tests that validate the entire individual registration feature, from the API endpoint to the database and the event-driven side effects. These tests will ensure all components, including the optimistic locking and event listeners, work together correctly.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/tests-standards.mdc</import>

<requirements>
- A new E2E test file must be created in the `test/tournament/` directory.
- Tests must cover the main success path, the optimistic locking failure path, and validate the event-driven side effects.
- The database must be in a clean state before each test.
</requirements>

## Subtasks

- [ ] 13.1 Create the test file `test/tournament/individual-registration.e2e-spec.ts`.
- [ ] 13.2 Write a test case for successfully creating an individual registration. Assert that a `201 Created` is returned and that the `Registration` and `RegistrationSync` records are created in the database.
- [ ] 13.3 Write a test case to verify optimistic locking. Send two concurrent requests and assert that one succeeds with a `201` and the other fails with a `409 Conflict`.
- [ ] 13.4 Write a test case for successfully canceling a registration.
- [ ] 13.5 Write a test case to verify that a competitor cannot register for the same tournament twice, ensuring a `409 Conflict` status code is returned.

## Implementation Details

### Test Scenarios

-   **Successful Registration & Event Flow:**
    1.  **Arrange:** Create a user, dependant, and an open `INDIVIDUAL` tournament.
    2.  **Act:** Send a valid `POST` request.
    3.  **Assert:** Expect `201 Created`. Verify the `Registration` record exists. Use a short delay and polling to verify the `RegistrationSync` record is created and eventually marked as `SYNCED`.
-   **Optimistic Lock Conflict:**
    1.  **Arrange:** Create a valid tournament.
    2.  **Act:** Use `Promise.all` to send two identical registration requests simultaneously.
    3.  **Assert:** Inspect the results. One should be a `201`, the other a `409`.

### Relevant Files

- `test/tournament/individual-registration.e2e-spec.ts`
- `test/utils/`

## Success Criteria

- All E2E tests pass reliably.
- The tests confirm the successful creation path, including the creation and processing of the `RegistrationSync` record.
- The optimistic locking mechanism is proven to prevent race conditions.
- The business rule preventing duplicate registrations is validated.
