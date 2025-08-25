---
status: completed
---
<task_context>
<domain>engine/infra/database</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
</task_context>

# Task 1.0: Foundation & Data Model

## Overview

This foundational task involves setting up the database schema for the `Tournament` entity using Prisma and running the migration to apply the changes to the database.

<requirements>
- A new `Tournament` model must be added to the Prisma schema.
- A new `TournamentType` enum must be added.
- A database migration must be successfully generated and applied.
</requirements>

## Subtasks

- [x] 1.1 Add `Tournament` model and `TournamentType` enum to `schema.prisma`.
- [x] 1.2 Generate a new Prisma migration named `add-tournament-table`.
- [x] 1.3 Apply the migration to the development database.

## Implementation Details

### Data Model (Prisma Schema)

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

### Relevant Files

- `prisma/schema.prisma`

### Dependent Files

- All files that will interact with the `Tournament` entity.

## Success Criteria

- The `npx prisma migrate dev --name add-tournament-table` command completes without errors.
- The new `tournament` table is visible in the database with the correct columns and types.
