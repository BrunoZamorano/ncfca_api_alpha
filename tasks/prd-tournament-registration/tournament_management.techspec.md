# Technical Specification: Tournament Management

## 1. Executive Summary

This document outlines the technical implementation for the **Tournament Management** feature. It is the first of three specifications covering the entire tournament functionality. This spec focuses exclusively on the creation, updating, deletion, and retrieval of tournament data.

The solution introduces a `TournamentModule` within the existing NestJS architecture. It leverages Prisma for data modeling, establishing a `Tournament` entity to store all tournament-related information. All interactions will be handled via a consolidated, role-protected `TournamentController`.

Subsequent specifications will cover Individual and Duo Registrations.

## 2. System Architecture

### 2.1. Domain Placement

-   `src/domain/entities/tournament/`: For the `Tournament` entity.
-   `src/domain/repositories/`: For the `TournamentRepository` interface.
-   `src/application/use-cases/tournament/`: For all use cases (write and read).
-   `src/application/queries/tournament-query/`: For the read model query interface.
-   `src/infraestructure/controllers/tournament/`: For the API controller.
-   `src/infraestructure/database/prisma/repositories/tournament/`: For the repository implementation.
-   `src/infraestructure/queries/tournament/`: For the query implementation.

### 2.2. Component Overview

-   **TournamentModule:** Encapsulates all related components.
-   **TournamentController:** Handles API requests, delegating all operations to their corresponding Use Cases.
-   **Use Cases:**
    -   **Write Path:** `CreateTournamentUseCase`, `UpdateTournamentUseCase`, `DeleteTournamentUseCase`. These use cases orchestrate the `Tournament` entity and the `TournamentRepository`.
    -   **Read Path:** `GetTournamentUseCase`, `ListTournamentsUseCase`. These use cases act as a facade, delegating the query execution to the `QueryService`.
-   **`TournamentRepository`:** Interface for the write model (`save`, `findById`).
-   **`TournamentQuery`:** Interface for the read model (`findById`, `search`).
-   **`QueryService`:** Provides access to the `TournamentQuery`.
-   **Data Mapper & Prisma Model:** Handle data persistence and translation.

## 3. Implementation Design

### 3.1. Contracts (DTOs)

#### 3.1.1. Command DTOs (Write Operations)

```typescript
// src/infraestructure/dtos/tournament/create-tournament.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsDateString } from 'class-validator';
import { TournamentType } from '@/domain/enums/tournament-type.enum';

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(TournamentType)
  type: TournamentType;

  @IsDateString()
  registrationStartDate: Date;

  @IsDateString()
  registrationEndDate: Date;

  @IsDateString()
  startDate: Date;
}

// src/infraestructure/dtos/tournament/update-tournament.dto.ts
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TournamentType } from '@/domain/enums/tournament-type.enum';

export class UpdateTournamentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TournamentType)
  @IsOptional()
  type?: TournamentType;

  @IsDateString()
  @IsOptional()
  registrationStartDate?: Date;

  @IsDateString()
  @IsOptional()
  registrationEndDate?: Date;

  @IsDateString()
  @IsOptional()
  startDate?: Date;
}
```

#### 3.1.2. Query DTOs (Read Operations)

```typescript
// src/infraestructure/dtos/tournament/list-tournaments-query.dto.ts
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import PaginationDto from '@/domain/dtos/pagination.dto';
import { ListTournamentsFilterDto } from './list-tournaments-filter.dto';

export class ListTournamentsQueryDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ListTournamentsFilterDto)
  filter?: ListTournamentsFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;
}

// src/infraestructure/dtos/tournament/list-tournaments-filter.dto.ts
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TournamentType } from '@/domain/enums/tournament-type.enum';

export class ListTournamentsFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TournamentType)
  type?: TournamentType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showDeleted?: boolean = false;
}

// src/application/queries/tournament-query/tournament.query.ts
export interface TournamentListItemDto {
  id: string;
  name: string;
  type: string;
  registrationStartDate: Date;
  registrationEndDate: Date;
  startDate: Date;
  registrationCount: number;
}

export interface TournamentDetailsDto extends TournamentListItemDto {
  description: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2. Repository Interface (Write Model)

```typescript
// src/domain/repositories/tournament.repository.ts
import { Tournament } from '@/domain/entities/tournament/tournament.entity';

export interface TournamentRepository {
  save(tournament: Tournament): Promise<void>; // Handles both create and update
  findById(id: string): Promise<Tournament | null>;
}

export const TOURNAMENT_REPOSITORY = Symbol('TOURNAMENT_REPOSITORY');
```

### 3.3. CQRS Query Interface (Read Model)

```typescript
// src/application/queries/tournament-query/tournament.query.ts
import { ListTournamentsQueryDto } from '@/infraestructure/dtos/tournament/list-tournaments-query.dto';
import { TournamentListItemDto, TournamentDetailsDto } from './tournament.query';

export interface TournamentQuery {
  findById(id: string, showDeleted?: boolean): Promise<TournamentDetailsDto | null>;
  search(query: ListTournamentsQueryDto): Promise<TournamentListItemDto[]>;
}

export const TOURNAMENT_QUERY = Symbol('TOURNAMENT_QUERY');

// src/application/services/query.service.ts
// (This interface will be updated)
export interface QueryService {
  // ... other queries
  readonly tournamentQuery: TournamentQuery;
}
```

### 3.4. Data Model (Prisma Schema)

```prisma
// prisma/schema.prisma

model Tournament {
  id                      String    @id @default(uuid())
  name                    String
  description             String
  type                    TournamentType
  registration_start_date DateTime
  registration_end_date   DateTime
  start_date              DateTime
  deleted_at              DateTime?
  created_at              DateTime  @default(now())
  updated_at              DateTime  @updatedAt

  @@map("tournament")
}

enum TournamentType {
  INDIVIDUAL
  DUO
}
```

### 3.5. API Endpoints

-   `POST /tournaments/create` (Admin): Create a new tournament.
-   `POST /tournaments/:id/update` (Admin): Update a tournament.
-   `POST /tournaments/:id/delete` (Admin): Logically delete a tournament.
-   `GET /tournaments` (Admin, Holder): List tournaments with filters.
-   `GET /tournaments/:id` (Admin, Holder): Get a single tournament.

### 3.6. Domain Model (DDD Entity)

```typescript
// src/domain/entities/tournament/tournament.entity.ts
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import { InvalidOperationException } from '@/domain/exceptions/invalid-operation.exception';

export class Tournament {
  // properties...

  public static create(props: {/*...*/}): Tournament {
    if (props.registrationEndDate < props.registrationStartDate) {
      throw new InvalidOperationException('Registration end date cannot be before the start date.');
    }
    return new Tournament(props);
  }

  public update(props: Partial<{/*...*/}>): void {
    if (this.registrationCount > 0) {
      throw new InvalidOperationException('Cannot update a tournament that already has registrations.');
    }
    // more validation...
    Object.assign(this, props, { updatedAt: new Date() });
  }

  public softDelete(): void {
    if (this.registrationCount > 0) {
      throw new InvalidOperationException('Cannot delete a tournament that already has registrations.');
    }
    this.deletedAt = new Date();
  }
}
```

### 3.7. Data Mapper

```typescript
// src/shared/mappers/tournament.mapper.ts
import { Tournament as Model } from '@prisma/client';
import { Tournament as Entity } from '@/domain/entities/tournament/tournament.entity';
import { TournamentType } from '@/domain/enums/tournament-type.enum';

export default class TournamentMapper {
  static toEntity(model: Model): Entity {
    // conversion logic...
  }

  static toPersistence(entity: Entity): Omit<Model, 'created_at' | 'updated_at'> {
    // conversion logic...
  }
}
```

## 4. Testing Approach

### 4.1. Unit Tests

#### 4.1.1. `Tournament` Entity (`/domain/entities/tournament/tournament.spec.ts`)
- **`create()`:**
  - Should create an instance with valid data.
  - Should throw `InvalidOperationException` if `registrationEndDate` is before `registrationStartDate`.
- **`update()`:**
  - Should update properties correctly.
  - Should throw `InvalidOperationException` if `registrationCount > 0`.
- **`softDelete()`:**
  - Should set `deletedAt` timestamp.
  - Should throw `InvalidOperationException` if `registrationCount > 0`.

#### 4.1.2. Write Use Cases (`/application/use-cases/tournament/`)
- **`create-tournament.use-case.spec.ts`:**
  - Should call `Tournament.create()` and `tournamentRepository.save()`.
- **`update-tournament.use-case.spec.ts`:**
  - Should fetch tournament, call `tournament.update()`, and `tournamentRepository.save()`.
  - Should throw `NotFoundException` if tournament is not found.
- **`delete-tournament.use-case.spec.ts`:**
  - Should fetch tournament, call `tournament.softDelete()`, and `tournamentRepository.save()`.
  - Should throw `NotFoundException` if tournament is not found.

#### 4.1.3. Read Use Cases (`/application/use-cases/tournament/`)
- **`get-tournament.use-case.spec.ts`:**
  - Should call `queryService.tournamentQuery.findById()` with the correct ID.
  - Should throw `NotFoundException` if the query returns null.
  - Should return the DTO on success.
- **`list-tournaments.use-case.spec.ts`:**
  - Should call `queryService.tournamentQuery.search()` with the correct query object.
  - Should return the list of DTOs on success.

### 4.2. E2E Tests (`/test/tournament/tournament.e2e-spec.ts`)

- **`POST /tournaments/create`:**
  - (Admin) Should return 201 on success.
  - (Admin) Should return 400 for invalid data.
- **`GET /tournaments/:id`:**
  - (Admin/Holder) Should return 200 and the `TournamentDetailsDto`.
  - (Admin/Holder) Should return 404 for a non-existent or deleted (for Holder) tournament.
- **`GET /tournaments`:**
  - (Admin/Holder) Should return 200 and a list of `TournamentListItemDto`.
  - (Admin) Should filter results correctly.
- **`POST /tournaments/:id/update`:**
  - (Admin) Should return 200 on success.
  - (Admin) Should return 404 for a non-existent ID.
- **`POST /tournaments/:id/delete`:**
  - (Admin) Should return 200 on success.
  - (Admin) Should return 404 for a non-existent ID.

## 5. Development Sequencing

1.  **Data Model:** Implement `Tournament` model in `schema.prisma` and migrate.
2.  **Domain:** Implement `Tournament` entity, `TournamentRepository` interface, and entity unit tests.
3.  **Mapper:** Implement `TournamentMapper`.
4.  **Write Path:** Implement `Create/Update/Delete` Use Cases and their unit tests.
5.  **Read Path:** Implement `TournamentQuery` interface and its Prisma implementation.
6.  **Read Path Use Cases:** Implement `Get/List` Use Cases and their unit tests.
7.  **Infrastructure:** Implement the Prisma `TournamentRepository`, update `QueryService`, and build the `TournamentController`.
8.  **E2E Tests:** Implement E2E tests for the controller.

## 6. Risks and Considerations

-   **Cross-Module Dependency:** The business rule preventing updates/deletes on tournaments with existing registrations creates a dependency on the future Registration module. This will be handled by checking the `registrationCount` property on the entity, which will be hydrated by the repository.
-   **Time Zone Strategy:** All `DateTime` fields will be stored and handled as UTC.
-   **Soft-Delete Consistency:** A Prisma middleware will be used to ensure all `find` queries automatically filter out records where `deleted_at` is not null, unless explicitly requested.

## 7. Out of Scope / Future Considerations

The following features and suggestions from the consensus review were considered but are deemed out of scope for this initial implementation to avoid over-engineering:

-   **Tournament Status:** A dedicated `status` field for managing the tournament lifecycle.
-   **Optimistic Locking:** A `version` field to prevent race conditions from concurrent updates.
-   **Domain Events:** Emitting events (e.g., `TournamentCreated`) for choreography between modules.
