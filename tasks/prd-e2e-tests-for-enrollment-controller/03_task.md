
status: pending
---

<task_context>
<domain>testing</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>http_server,database</dependencies>
</task_context>

# Task 3.0: Implement E2E Tests for Listing Enrollment Requests (`GET /enrollments/my-requests`)

## Overview

This task covers the creation of the E2E test suite for the endpoint that lists a user's family enrollment requests (`GET /enrollments/my-requests`). The tests will ensure the endpoint correctly returns data for authenticated users and properly handles tenancy and empty states.

<requirements>
- A new test file must be created at `test/enrollment/list-my-requests.e2e-spec.ts`.
- All test cases specified in the PRD and Tech Spec must be implemented.
- Tests must use the helper functions from `setup.ts`.
- Tests must follow the AAA (Arrange, Act, Assert) pattern.
- The database must be cleaned up after all tests in the suite have run.
</requirements>

## Subtasks

-   [ ] 3.1 Create the spec file `test/enrollment/list-my-requests.e2e-spec.ts`.
-   [ ] 3.2 Implement the success case: `should return a list of enrollment requests for the user's family (200 OK)`.
-   [ ] 3.3 Implement the empty state case: `should return an empty list if no requests exist (200 OK)`.
-   [ ] 3.4 Implement the tenancy case: `should not return requests from other families`.
-   [ ] 3.5 Implement the auth case: `should fail if user is not authenticated (401 Unauthorized)`.
-   [ ] 3.6 Ensure the `afterAll` hook is configured to call `enrollmentCleanup()`.

## Implementation Details

This spec file will contain all test cases for the `GET /enrollments/my-requests` endpoint. It will use the utilities from `setup.ts` to create the necessary preconditions for each test.

**Test Case Checklist:**
-   Success, returns list (200)
-   Success, returns empty list (200)
-   Does not return other families' data
-   Unauthenticated (401)

### Relevant Files

-   `test/enrollment/list-my-requests.e2e-spec.ts` (to be created)

### Dependent Files

-   `test/enrollment/setup.ts`

## Success Criteria

-   All specified test cases are implemented and pass successfully.
-   The tests confirm that the endpoint correctly filters requests by the authenticated user's family.
-   The test suite runs cleanly and performs proper cleanup.

---