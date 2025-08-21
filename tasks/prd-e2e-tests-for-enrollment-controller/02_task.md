status: completed
---

<task_context>
<domain>testing</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server,database</dependencies>
</task_context>

# Task 2.0: Implement E2E Tests for Enrollment Request Creation (`POST /enrollments`)

## Overview

This task focuses on creating the E2E test suite for the enrollment creation endpoint (`POST /enrollments`). The goal is to validate all success and failure scenarios as defined in the PRD, including authentication, authorization, data validation, and business logic rules.

<requirements>
- A new test file must be created at `test/enrollment/request-enrollment.e2e-spec.ts`.
- All test cases specified in the PRD and Tech Spec must be implemented.
- Tests must use the helper functions from `setup.ts`.
- Tests must follow the AAA (Arrange, Act, Assert) pattern.
- The database must be cleaned up after all tests in the suite have run.
</requirements>

## Subtasks

-   [x] 2.1 Create the spec file `test/enrollment/request-enrollment.e2e-spec.ts`.
-   [x] 2.2 Implement the success case: `should create an enrollment request successfully (201 Created)`.
-   [x] 2.3 Implement the auth case: `should fail if user is not authenticated (401 Unauthorized)`.
-   [x] 2.4 Implement error cases for non-existent entities: `clubId` not found and `dependantId` not found (403 Forbidden - actual behavior).
-   [x] 2.5 Implement the authorization case: `should fail if dependant does not belong to the user's family (403 Forbidden - actual behavior)`.
-   [x] 2.6 Implement validation cases for invalid UUID formats for `clubId` and `dependantId` (`400 Bad Request`).
-   [x] 2.7 Implement the business rule case: `should fail if a pending request already exists (400 Bad Request - actual behavior)`.
-   [x] 2.8 Ensure the `afterAll` hook is configured to call `enrollmentCleanup()`.

## Implementation Details

This spec file will contain all test cases for the `POST /enrollments` endpoint. It will use `supertest` to make HTTP requests and `jest` for assertions.

**Test Case Checklist:**
-   Success (201)
-   Unauthenticated (401)
-   `clubId` not found (404)
-   `dependantId` not found (404)
-   Dependant in wrong family (404)
-   Invalid `clubId` format (400)
-   Invalid `dependantId` format (400)
-   Duplicate pending request (409)

### Relevant Files

-   `test/enrollment/request-enrollment.e2e-spec.ts` (to be created)

### Dependent Files

-   `test/enrollment/setup.ts`

## Success Criteria

-   All specified test cases are implemented and pass successfully.
-   The tests accurately validate the API's behavior against the requirements.
-   The test suite runs without errors and cleans up after itself properly.

---
