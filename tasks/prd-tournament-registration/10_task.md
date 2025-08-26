---
status: pending
---

<task_context>
<domain>infrastructure/api</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>task:9.0</dependencies>
</task_context>

# Task 10.0: Infrastructure Layer: Expose Registration API Endpoints

## Overview

This task focuses on the infrastructure layer, specifically exposing the registration functionality through the API. You will create the necessary Data Transfer Objects (DTOs) for request validation and update the `TournamentController` to handle the new registration routes.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/folder-structure.mdc</import>

<requirements>
- DTOs must include `class-validator` decorators for validation.
- The `TournamentController` must be updated to include the new endpoints.
- The `TournamentModule` must be updated to provide the use cases to the controller.
</requirements>

## Subtasks

- [ ] 10.1 Create `RequestIndividualRegistrationDto` in `src/infraestructure/dtos/tournament/request-individual-registration.dto.ts`.
- [ ] 10.2 Create `CancelRegistrationDto` in `src/infraestructure/dtos/tournament/cancel-registration.dto.ts`.
- [ ] 10.3 Add the `request-individual` and `cancel` POST endpoints to `src/infraestructure/controllers/tournament/tournament.controller.ts`.
- [ ] 10.4 Ensure the controller methods are connected to the corresponding application use cases.

## Implementation Details

### DTOs

```typescript
// src/infraestructure/dtos/tournament/request-individual-registration.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class RequestIndividualRegistrationDto {
  @IsString()
  @IsNotEmpty()
  tournamentId: string;

  @IsString()
  @IsNotEmpty()
  competitorId: string; // ID of the Dependant
}
```

### API Endpoints

-   `POST /tournaments/registrations/request-individual`
-   `POST /tournaments/registrations/cancel`

### Relevant Files

- `src/infraestructure/dtos/tournament/request-individual-registration.dto.ts`
- `src/infraestructure/dtos/tournament/cancel-registration.dto.ts`
- `src/infraestructure/controllers/tournament/tournament.controller.ts`
- `src/application/modules/tournament.module.ts`

## Success Criteria

- The new endpoints are accessible and protected by the existing authentication guards.
- Request bodies are correctly validated against the DTOs.
- Valid requests are successfully passed to the application layer use cases.
