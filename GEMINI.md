# Project Overview

sempre responda em pt-br
follow @code.standards.yml
follow @folder-structure.standards.yml
follow @test.standards.yml

This is a NestJS application that serves as the backend API for the NCFCA system. It manages users, families, clubs, enrollments, and other related entities. The application uses a PostgreSQL database with Prisma as the ORM. It also integrates with a RabbitMQ message broker for handling asynchronous tasks.

## Key Technologies

*   **Framework:** NestJS
*   **Language:** TypeScript
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **API Documentation:** Swagger (OpenAPI)
*   **Messaging:** RabbitMQ
*   **Testing:** Jest

## Architecture

The application follows a modular architecture, with different features encapsulated in their own modules. The main modules include:

*   **AuthModule:** Handles user authentication and authorization.
*   **ClubModule:** Manages club-related operations.
*   **AdminModule:** Provides administrative functionalities.
*   **AccountModule:** Manages user accounts.
*   **WebhookModule:** Handles incoming webhooks.
*   **CheckoutModule:** Manages the checkout process.
*   **DependantModule:** Manages user dependants.
*   **EnrollmentModule:** Manages enrollment requests.
*   **ClubManagementModule:** Manages club administration.
*   **TrainingModule:** Manages training resources.
*   **ClubRequestModule:** Manages requests to create new clubs.

The application uses a global exception filter for consistent error handling and a validation pipe for request data validation. It also uses an admin seed script to populate initial data.

# Building and Running

## Prerequisites

*   Node.js
*   pnpm
*   PostgreSQL
*   RabbitMQ

## Installation

```bash
pnpm install
```

## Running the Application

### Development

```bash
pnpm run start:dev
```

The application will be available at `http://localhost:3000`. The API documentation can be accessed at `http://localhost:3000/docs`.

### Production

```bash
pnpm run start:prod
```

## Testing

### Unit Tests

```bash
pnpm run test:unit
```

### End-to-End (E2E) Tests

```bash
pnpm run test:e2e
```

# Development Conventions

## Code Style

The project uses Prettier for code formatting and ESLint for linting. Use the following command to format the code:

```bash
pnpm run format
```

## Database Migrations

The project uses Prisma Migrate for database migrations. To create a new migration, use the following command:

```bash
npx prisma migrate dev --name <migration_name>
```

## API Documentation

The API is documented using Swagger. The documentation is automatically generated from the code and is available at the `/docs` endpoint.
