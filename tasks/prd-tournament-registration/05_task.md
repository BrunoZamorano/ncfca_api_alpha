---
status: completed
---
<task_context>
<domain>engine/infra/api</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>application</dependencies>
</task_context>

# Task 5.0: Infrastructure Layer & API Endpoints

## Overview

This task involves creating the infrastructure components that expose the tournament management functionality via a REST API. This includes the controller, the DTOs for request validation, the Prisma implementation of the repository, and wiring everything together in a new `TournamentModule`.

<requirements>
- A `TournamentController` must be created with all specified endpoints, following the project's REST conventions.
- DTOs with `class-validator` decorators must be used for all request bodies and query params.
- The Prisma implementation of the `TournamentRepository` must be completed and placed in the correct folder.
- All components must be encapsulated within a `TournamentModule`.
</requirements>

## Subtasks

- [x] 5.1 Implement all DTOs (`CreateTournamentDto`, `UpdateTournamentDto`, `ListTournamentsQueryDto`, etc.).
- [x] 5.2 Implement the `PrismaTournamentRepository` in `src/infraestructure/repositories/prisma/`.
- [x] 5.3 Implement the `TournamentController` with all five API endpoints.
- [x] 5.4 Add appropriate guards (`@Roles(UserRoles.ADMIN)`) to secure the endpoints.
- [x] 5.5 Create and configure the `TournamentModule` to provide and export all necessary components.
- [x] 5.6 Update the `SharedModule` to include the `tournamentQuery` and `tournamentRepository`.

## Implementation Details

### API Endpoints (REST Convention)
-   `POST /tournaments/create` (Admin)
-   `POST /tournaments/:id/update` (Admin)
-   `POST /tournaments/:id/delete` (Admin)
-   `GET /tournaments` (Admin, Holder)
-   `GET /tournaments/:id` (Admin, Holder)

### Folder Structure
- Repository Implementation: `src/infraestructure/repositories/tournament/prisma-tournament.repository.ts`
- Query Implementation: `src/infraestructure/queries/tournament/prisma-tournament.query.ts`

### Relevant Files
- `src/infraestructure/dtos/tournament/`
- `src/infraestructure/repositories/tournament/prisma-tournament.repository.ts`
- `src/infraestructure/controllers/tournament/tournament.controller.ts`
- `src/application/services/query.service.ts`
- A new module file, likely `src/infraestructure/controllers/tournament/tournament.module.ts`

## Success Criteria
- All API endpoints are implemented and functional, following the specified REST conventions.
- Request data is correctly validated using the DTOs.
- The repository implementation is placed in the correct directory (`infraestructure/repositories`).
- The `TournamentModule` correctly injects all dependencies.
