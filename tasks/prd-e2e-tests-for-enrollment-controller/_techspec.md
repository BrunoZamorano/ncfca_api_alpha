# Technical Specification: E2E Test Suite for Enrollment Controller

**Feature Slug:** `e2e-tests-for-enrollment-controller`

## 1. Overview
This document provides the technical implementation plan for creating an End-to-End (E2E) test suite for the `EnrollmentController`. This suite will validate the functionality of creating and listing enrollment requests as defined in the corresponding PRD.

## 2. Architecture and Design
The test suite will follow the established E2E testing architecture within the project. It will leverage `Jest` as the test runner, `supertest` for making HTTP requests to the application, and the existing `PrismaService` for test data setup and teardown.

The tests will be self-contained and will not rely on any external services or pre-existing data in the test database. All required data will be created programmatically before each test or suite (`Arrange`) and destroyed afterward (`afterAll` hook).

## 3. File Structure
The following new files will be created:

```
test/
└── enrollment/
    ├── setup.ts
    ├── request-enrollment.e2e-spec.ts
    └── list-my-requests.e2e-spec.ts
```

## 4. Component Design

### 4.1. `test/enrollment/setup.ts`
This file will export utility functions to support the test specs. It will be modeled after `test/club-management/setup.ts` to maintain consistency.

#### **`setupEnrollmentApp()`**
*   **Description:** Initializes and returns a NestJS testing application instance (`INestApplication`) and the `PrismaService`. This function will handle module compilation and application setup.
*   **Returns:** `{ app: INestApplication, prisma: PrismaService }`

#### **`createRegularUser()`**
*   **Description:** Creates a standard user with an associated `Family` and an active `Affiliation`. This user will be used to generate authenticated requests. It will return the user's details and an authentication token.
*   **Parameters:** `(prisma: PrismaService, app: INestApplication)`
*   **Returns:** `Promise<{ user: User, family: Family, accessToken: string }>`

#### **`createTestClub()`**
*   **Description:** Creates a `Club` with a designated `ClubDirector`.
*   **Parameters:** `(prisma: PrismaService, directorId: string)`
*   **Returns:** `Promise<Club>`

#### **`createTestDependant()`**
*   **Description:** Creates a `Dependant` associated with a specific `Family`.
*   **Parameters:** `(prisma: PrismaService, familyId: string)`
*   **Returns:** `Promise<Dependant>`

#### **`enrollmentCleanup()`**
*   **Description:** Performs a targeted deletion of all data created during the tests. It must delete records in the correct order to respect foreign key constraints. The deletion order should be: `EnrollmentRequest`, `Dependant`, `Club`, `Affiliation`, `Family`, `User`.
*   **Parameters:** `(prisma: PrismaService)`
*   **Returns:** `Promise<void>`

### 4.2. `test/enrollment/request-enrollment.e2e-spec.ts`
This spec file will contain all test cases for the `POST /enrollments` endpoint.

*   **Setup:** It will use the `beforeAll` hook to set up the application and create a standard user and a test club. The `afterAll` hook will call `enrollmentCleanup`.
*   **Test Cases:**
    *   **`should create an enrollment request successfully (201 Created)`**:
        *   Arrange: Create a dependant for the user's family.
        *   Act: Send a POST request to `/enrollments` with valid `dependantId` and `clubId`.
        *   Assert: Verify the `201` status code and check the database to confirm the `EnrollmentRequest` was created with the correct data.
    *   **`should fail if user is not authenticated (401 Unauthorized)`**:
        *   Act: Send the request without an `Authorization` header.
        *   Assert: Verify the `401` status code.
    *   **`should fail if clubId does not exist (404 Not Found)`**:
        *   Act: Send the request with a random, non-existent UUID for `clubId`.
        *   Assert: Verify the `404` status code.
    *   **`should fail if dependantId does not exist (404 Not Found)`**:
        *   Act: Send the request with a random, non-existent UUID for `dependantId`.
        *   Assert: Verify the `404` status code.
    *   **`should fail if dependant does not belong to the user's family (404 Not Found)`**:
        *   Arrange: Create a second user and a dependant for that user's family.
        *   Act: As the first user, attempt to enroll the second user's dependant.
        *   Assert: Verify the `404` status code. **(Assumption: 404 is used for security)**
    *   **`should fail for invalid clubId format (400 Bad Request)`**:
        *   Act: Send the request with a non-UUID string for `clubId`.
        *   Assert: Verify the `400` status code.
    *   **`should fail for invalid dependantId format (400 Bad Request)`**:
        *   Act: Send the request with a non-UUID string for `dependantId`.
        *   Assert: Verify the `400` status code.
    *   **`should fail if a pending request already exists (409 Conflict)`**:
        *   Arrange: Create a dependant and an initial enrollment request for them.
        *   Act: Send a second, identical enrollment request.
        *   Assert: Verify a `409 Conflict` (or similar) status code, assuming this is the business rule implementation.

### 4.3. `test/enrollment/list-my-requests.e2e-spec.ts`
This spec file will contain all test cases for the `GET /enrollments/my-requests` endpoint.

*   **Setup:** Similar to the previous spec, it will use `beforeAll` and `afterAll` for setup and cleanup.
*   **Test Cases:**
    *   **`should return a list of enrollment requests for the user's family (200 OK)`**:
        *   Arrange: Create a dependant and an enrollment request for them.
        *   Act: Send a GET request to `/enrollments/my-requests`.
        *   Assert: Verify the `200` status code and that the response body contains the created request.
    *   **`should return an empty list if no requests exist (200 OK)`**:
        *   Act: Send a GET request without creating any requests first.
        *   Assert: Verify the `200` status code and that the response body is an empty array.
    *   **`should not return requests from other families`**:
        *   Arrange: Create two users. Create an enrollment request for a dependant of the second user.
        *   Act: As the first user, send a GET request.
        *   Assert: Verify the response is an empty array.
    *   **`should fail if user is not authenticated (401 Unauthorized)`**:
        *   Act: Send the request without an `Authorization` header.
        *   Assert: Verify the `401` status code.

## 5. Development Plan
1.  Create the directory `test/enrollment/`.
2.  Implement `test/enrollment/setup.ts` with all the required helper functions.
3.  Implement the test cases in `request-enrollment.e2e-spec.ts`.
4.  Implement the test cases in `list-my-requests.e2e-spec.ts`.
5.  Run the full E2E test suite locally to ensure all new and existing tests pass.
6.  Commit the new files.

## 6. Open Questions & Risks
*   **Risk:** The `enrollmentCleanup()` function must be carefully implemented to prevent test flakiness.
*   **Assumption:** The business logic for handling duplicate pending enrollment requests (RF2.8) results in a `409 Conflict` status code. This needs to be verified.
*   **Decision Confirmation:** Confirm that returning `404 Not Found` for RF2.5 (enrolling another family's dependant) is the desired behavior over `403 Forbidden`.
