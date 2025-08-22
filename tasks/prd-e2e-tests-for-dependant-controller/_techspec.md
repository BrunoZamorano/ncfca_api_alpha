# Technical Specification: E2E Tests for DependantController

## Executive Summary

This specification outlines the implementation of comprehensive End-to-End (E2E) tests for the DependantController within the NCFCA API's Clean Architecture framework. The solution follows established patterns from the club-management test module, implementing surgical database cleanup and role-based access control testing. The approach emphasizes test isolation, maintainability, and complete coverage of the dependant management workflows while adhering to SOLID principles and NestJS testing best practices.

## System Architecture

### Domain Placement

The E2E test implementation will be organized as follows:

- `test/dependant/` - Main test directory for DependantController E2E tests
- `test/dependant/setup.ts` - Test setup utilities and helper functions
- `test/dependant/*.e2e-spec.ts` - Individual test files for each endpoint
- `test/utils/` - Shared utilities (already existing)

### Component Overview

**Primary Components:**
- **DependantTestSetup**: Initialization utilities for test application, user creation, and data preparation
- **DependantE2ETests**: Test suites covering all six controller endpoints with success/error scenarios
- **SurgicalCleanup**: Database cleanup utilities ensuring test isolation
- **TestDataFactories**: Helper functions for creating test dependants, families, and users

**Key Relationships:**
- Test setup inherits from existing club-management patterns
- Database operations use PrismaService through test module configuration
- Authentication flows leverage existing JWT token generation utilities
- Data flow follows User → Family → Dependant entity relationships

**Data Flow Overview:**
Request → AuthGuard → Controller → UseCase → Repository → Database → Response

## Implementation Design

### Core Interfaces

```typescript
// Test setup interface following established patterns
export interface DependantTestUser {
  userId: string;
  familyId: string;
  accessToken: string;
}

// Test data factory interface
export interface CreateDependantOptions {
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
  relationship?: DependantRelationship;
  type?: DependantType;
  sex?: Sex;
}
```

### Data Models

**Core Test Entities:**
- **TestUser**: Authenticated user with family and access token
- **TestDependant**: Dependant entity with Brazilian validation (CPF)
- **TestFamily**: Family structure with affiliation status
- **ValidationScenarios**: Edge cases for CPF, dates, and relationship validations

**Request/Response Types:**
- **AddDependantDto**: Input validation for dependant creation
- **UpdateDependantDto**: Partial update payload structure
- **DependantDto**: Standard response format
- **FamilyDto**: Family view response with dependants list

### API Endpoints

The following endpoints will be comprehensively tested:

- `POST /dependants` - Create new dependant with validation
- `GET /dependants/my-family` - Retrieve complete family structure
- `GET /dependants/:id` - View specific dependant with ownership validation
- `GET /dependants` - List all family dependants
- `PATCH /dependants/:id` - Update dependant with authorization checks
- `DELETE /dependants/:id` - Remove dependant with cascade considerations

## Integration Points

**Authentication Requirements:**
- JWT token validation through AuthGuard
- Role-based access control for family ownership
- Unauthorized access scenario testing

**Error Handling Approach:**
- Global exception filter integration testing
- Brazilian CPF validation error scenarios
- 404 handling for non-existent dependants
- 403 handling for cross-family access attempts

## Impact Analysis

| Affected Component | Type of Impact | Description & Risk Level | Required Action |
| --- | --- | --- | --- |
| `test/` directory structure | New Test Module | Adds new test directory. Low risk. | Follow naming conventions |
| `PrismaService` test usage | Database Load | Additional test queries. Low risk. | Monitor cleanup efficiency |
| CI/CD pipeline | Execution Time | New test suite addition. Medium risk. | Optimize test parallelization |
| `club-management` tests | Shared Utilities | Uses common cleanup functions. Low risk. | Ensure compatibility |
| Database test isolation | Concurrency | Multiple test suites using DB. Medium risk. | Implement proper cleanup |

**Direct Dependencies:**
- Inherits from existing test utilities in `test/utils/`
- Uses established setup patterns from `test/club-management/`
- Leverages PrismaService for database operations

**Shared Resources:**
- Test database instance shared across all E2E tests
- Common authentication and user creation utilities
- Surgical cleanup functions for data isolation

## Testing Approach

### Unit Tests

**Key Components to Test:**
- Authentication flow integration with controller endpoints
- DTO validation and transformation pipelines
- Business rule enforcement (family ownership, CPF validation)
- Error handling and exception filtering

**Mock Requirements:**
- External CPF validation services (if any)
- SMTP services for potential notification features
- Payment services for family affiliation status

**Critical Test Scenarios:**
- Cross-family access prevention
- Invalid CPF format handling
- Future birthdate validation
- Relationship type constraints

### Integration Tests

**Components to Test Together:**
- Controller → UseCase → Repository → Database flow
- Authentication → Authorization → Business Logic pipeline
- DTO validation → Error handling → Response formatting

**Test Data Requirements:**
- Multiple test families with different affiliation statuses
- Various dependant types and relationships
- Edge case data for validation testing

## Development Sequencing

### Build Order

1. **Test Setup Infrastructure** (Foundation)
   - Create `test/dependant/setup.ts` with user and data creation utilities
   - Implement surgical cleanup functions specific to dependant testing
   - Establish test application initialization patterns

2. **Happy Path Tests** (Core Functionality)
   - Implement success scenario tests for all six endpoints
   - Focus on authenticated user workflows
   - Validate proper response formats and status codes

3. **Validation and Error Tests** (Edge Cases)
   - Add CPF validation failure scenarios
   - Implement unauthorized access testing
   - Cover 404 and business rule violation cases

4. **Integration and Optimization** (Refinement)
   - Optimize test execution performance
   - Ensure proper test isolation and cleanup
   - Add comprehensive assertion coverage

### Technical Dependencies

**Required Infrastructure:**
- NestJS testing module configuration
- Supertest HTTP request simulation
- Jest testing framework with TypeScript support

**External Service Availability:**
- PostgreSQL test database instance
- Prisma ORM with test schema migration

## Monitoring & Observability

**Metrics to Expose:**
- Test execution duration per endpoint
- Database query count during test runs
- Memory usage during test suite execution

**Key Logs and Log Levels:**
- ERROR: Test failures and database constraint violations
- WARN: Slow test execution or cleanup issues
- INFO: Test suite execution summary and statistics

**Integration with Existing Infrastructure:**
- Leverage existing test reporting in CI/CD pipeline
- Use Jest coverage reporting for code coverage metrics
- Monitor test database performance during execution

## Technical Considerations

### Key Decisions

**Test Structure Approach:**
- **Decision**: Follow club-management patterns with separate setup.ts file
- **Rationale**: Maintains consistency and leverages proven patterns
- **Trade-offs**: Slightly more setup overhead vs. better maintainability

**Database Cleanup Strategy:**
- **Decision**: Surgical cleanup rather than database truncation
- **Rationale**: Ensures test isolation and prevents data conflicts
- **Trade-offs**: More complex cleanup logic vs. better test reliability

**Authentication Testing:**
- **Decision**: Test both authenticated and unauthorized scenarios
- **Rationale**: Critical for security validation in family data access
- **Trade-offs**: Increased test complexity vs. comprehensive security coverage

### Known Risks

**Potential Challenges:**
- Test execution time may increase significantly with comprehensive coverage
- Complex family relationship scenarios may create hard-to-debug failures
- Database constraint violations during cleanup operations

**Mitigation Approaches:**
- Implement test parallelization where safe
- Create comprehensive error logging for debugging
- Use transaction-based cleanup to ensure consistency

**Areas Needing Research:**
- Brazilian CPF validation service integration testing
- Performance benchmarks for acceptable test execution time
- Optimal test data volume for reliable validation

### Special Requirements

**Performance Requirements:**
- Individual test execution should complete within 10 seconds
- Complete test suite should execute within 2 minutes
- Database cleanup operations must be atomic and reliable

**Security Considerations:**
- Validate that test users cannot access other families' data
- Ensure test data is properly isolated and cleaned
- Verify that authentication tokens have appropriate scope

### Standards Compliance

**Architectural Principles:**
- Follows Clean Architecture with clear separation of concerns
- Implements SOLID principles in test structure and utilities
- Uses Repository pattern for data access in test setup

**Testing Standards:**
- Follows AAA (Arrange, Act, Assert) pattern in all tests
- Implements proper test isolation with surgical cleanup
- Uses descriptive test names and comprehensive assertions

**Code Quality:**
- TypeScript strict mode compliance
- ESLint and Prettier formatting standards
- Comprehensive error handling in test utilities