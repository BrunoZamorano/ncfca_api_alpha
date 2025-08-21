---
status: pending
---

<task_context>
<domain>testing</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Task 1.0: Create E2E Test Setup Utilities for Enrollment

## Overview

This task involves creating the foundational setup file required for the enrollment E2E tests. This includes creating a new directory and a `setup.ts` file containing helper functions for bootstrapping the test environment, creating necessary test data entities (users, clubs, dependants), and cleaning up the database after tests are complete.

<requirements>
- A new directory must be created at `test/enrollment/`.
- A new file must be created at `test/enrollment/setup.ts`.
- The `setup.ts` file must export all functions as specified in the Tech Spec.
- The cleanup function must be robust to prevent data leakage between test suites.
</requirements>

## Subtasks

-   [ ] 1.1 Create the directory `test/enrollment/`.
-   [ ] 1.2 Implement the `setupEnrollmentApp()` function to initialize the NestJS application for testing.
-   [ ] 1.3 Implement the `createRegularUser()` function to generate a test user with a family, affiliation, and auth token.
-   [ ] 1.4 Implement the `createTestClub()` function.
-   [ ] 1.5 Implement the `createTestDependant()` function.
-   [ ] 1.6 Implement the `enrollmentCleanup()` function, ensuring it deletes records in the correct order to respect foreign key constraints.
-   [ ] 1.7 Add unit tests for the setup utility functions to ensure they work as expected.

## Implementation Details

The `setup.ts` file will export utility functions to support the test specs. It should be modeled after `test/club-management/setup.ts` to maintain consistency.

**Key Functions:**
-   `setupEnrollmentApp()`: Returns `{ app: INestApplication, prisma: PrismaService }`.
-   `createRegularUser()`: Returns `Promise<{ user: User, family: Family, accessToken: string }>`.
-   `createTestClub()`: Returns `Promise<Club>`.
-   `createTestDependant()`: Returns `Promise<Dependant>`.
-   `enrollmentCleanup()`: Performs targeted deletion of `EnrollmentRequest`, `Dependant`, `Club`, `Affiliation`, `Family`, and `User` records.

### Relevant Files

-   `test/enrollment/setup.ts` (to be created)

### Dependent Files

-   `test/enrollment/request-enrollment.e2e-spec.ts`
-   `test/enrollment/list-my-requests.e2e-spec.ts`

## Success Criteria

-   The `setup.ts` file is created at the correct location and exports all required functions.
-   The helper functions successfully create and manage test data in the database.
-   The `enrollmentCleanup()` function completely removes all data created by the helper functions, leaving the database in a clean state.

---