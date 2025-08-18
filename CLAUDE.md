# CLAUDE.md
sempre responda em pt-br
follow @code.standards.yml
follow @folder-structure.standards.yml
follow @test.standards.yml

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS-based API for the NCFCA (National Christian Forensics & Communications Association) club management system. It handles user registration, family management, club operations, enrollments, and payment processing with a focus on debate and forensics club administration.

## Essential Commands

### Development
```bash
# Install dependencies
pnpm install

# Start development server (with watch mode)
pnpm run start:dev

# Start with debugging
pnpm run start:debug

# Build the application
pnpm run build

# Generate Prisma client (run after schema changes)
npx prisma generate
```

### Database Operations
```bash
# Run database migrations
npx prisma migrate dev --name <migration_name>

# Reset database and run seed
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio

# Deploy migrations to production
npx prisma migrate deploy
```

### Testing
```bash
# Run unit tests
pnpm run test:unit

# Run unit tests in watch mode  
pnpm run test:unit:watch

# Run e2e tests
pnpm run test:e2e

# Run all tests with coverage
pnpm run test:cov
```

### Code Quality
```bash
# Lint and fix code
pnpm run lint

# Format code with Prettier
pnpm run format

# Generate OpenAPI documentation
pnpm run openapi:generate
```

### Infrastructure
```bash
# Start PostgreSQL and RabbitMQ with Docker
docker compose up -d

# Stop services
docker compose down
```

## Architecture

The application follows **Clean Architecture** principles with clear separation of concerns:

### Layer Structure
- **Domain Layer** (`src/domain/`): Core business logic, entities, value objects, and interfaces
- **Application Layer** (`src/application/`): Use cases, queries, and application services  
- **Infrastructure Layer** (`src/infraestructure/`): External concerns (database, controllers, services)

### Key Patterns
- **Use Cases**: Business logic encapsulated in focused, testable classes
- **Repository Pattern**: Data access abstraction with Prisma implementations
- **Value Objects**: Immutable objects for complex validations (Email, CPF, Address, etc.)
- **Domain Events**: RabbitMQ-based async processing for club requests

## Core Domain Concepts

### Main Entities
- **User**: System users with roles (ADMIN, DONO_DE_CLUBE, SEM_FUNCAO)
- **Family**: Groups users and dependants under a family unit with affiliation status
- **Club**: Debate/forensics clubs with principals and member limits
- **Dependant**: Family members (students, alumni, parents) who can join clubs
- **ClubMembership**: Many-to-many relationship between dependants and clubs
- **EnrollmentRequest**: Workflow for joining clubs (pending → approved/rejected)
- **ClubRequest**: Workflow for creating new clubs
- **Training**: Educational resources with YouTube integration
- **Transaction**: Payment processing with Stripe integration

### Key Business Rules
- Users create families and add dependants
- Families must be affiliated (paid) before members can join clubs
- Club enrollment requires approval from club principals
- New clubs require admin approval through ClubRequest workflow
- CPF (Brazilian tax ID) validation throughout the system

## Database Schema

Uses **PostgreSQL** with **Prisma ORM**. Key relationships:
- User → Family (1:1, holder relationship)
- Family → Dependant[] (1:many)
- Club ↔ Dependant (many:many via ClubMembership)
- EnrollmentRequest tracks club joining workflow
- Transaction handles payment processing

Migration files are in `prisma/migrations/` and schema is in `prisma/schema.prisma`.

## Module Architecture

### Feature Modules
- **AuthModule**: JWT-based authentication with refresh tokens
- **ClubModule**: Club search and information retrieval  
- **ClubManagementModule**: Club administration (enrollment approval, member management)
- **ClubRequestModule**: New club creation workflow
- **AdminModule**: System administration (user management, club oversight)
- **AccountModule**: User profile and password management
- **DependantModule**: Family member management
- **EnrollmentModule**: Club joining requests
- **TrainingModule**: Educational content management
- **CheckoutModule**: Payment processing with Stripe
- **WebhookModule**: External service integrations

### Testing Strategy
- **Unit Tests**: `*.spec.ts` files alongside source code, focus on use cases and entities
- **E2E Tests**: `test/*.e2e-spec.ts` files for full API workflows
- **Test Utilities**: Shared helpers in `test/utils/` for database setup and polling

### Configuration Notes
- Path mapping: `@/` maps to `src/` directory
- Environment variables in `.env` (check `.env.example` for required vars)
- Swagger documentation available at `/docs` endpoint
- Global exception filter provides consistent error responses
- Global validation pipe with transformation enabled

## Development Workflow

1. **Database Changes**: Update `prisma/schema.prisma` → run `npx prisma migrate dev`
2. **New Features**: Create use case in `application/use-cases/` → add controller in `infraestructure/controllers/` → update module
3. **Testing**: Write unit tests for use cases, e2e tests for complete workflows
4. **API Documentation**: Use Swagger decorators, generate with `pnpm run openapi:generate`

## Important Patterns

### Use Case Pattern
All business logic is encapsulated in use case classes with dependency injection:
```typescript
export class CreateClubUseCase {
  constructor(
    private clubRepository: ClubRepository,
    private unitOfWork: UnitOfWork
  ) {}
}
```

### Value Object Validation
Complex validations are handled in value objects:
- `Email`: Email format validation
- `CPF`: Brazilian tax ID validation and formatting
- `Address`: Brazilian address structure
- `Password`: Hashing and strength requirements

### Repository Abstraction
Domain defines interfaces, infrastructure provides Prisma implementations:
- Interface: `src/domain/repositories/`
- Implementation: `src/infraestructure/repositories/prisma/`

### Query vs Command Separation  
- **Commands**: Use cases that modify state
- **Queries**: Optimized read operations in `application/queries/`