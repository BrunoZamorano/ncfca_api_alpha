---
status: pending
---

<task_context>
<domain>database/migrations</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>none</dependencies>
</task_context>

# Task 7.0: Database: Add Registration Schema & Optimistic Locking

## Overview

This foundational task involves updating the Prisma schema to support tournament registrations and implementing a concurrency control mechanism. You will add the `Registration` and `RegistrationSync` models and add a `version` column to the `Tournament` model to enable optimistic locking.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/sql-database.mdc</import>

<requirements>
- The new models and enums must match the technical specification.
- A `version` column must be added to the `tournaments` table.
- A new migration file must be generated and applied successfully.
</requirements>

## Subtasks

- [ ] 7.1 Add the `Registration` and `RegistrationSync` models to `prisma/schema.prisma`.
- [ ] 7.2 Add the `RegistrationType`, `RegistrationStatus`, and `SyncStatus` enums.
- [ ] 7.3 Update the `Tournament` model to include the `registrations` relation and a `version` column.
- [ ] 7.4 Run `npx prisma migrate dev --name add_registration_and_optimistic_lock` to generate and apply the migration.

## Implementation Details

### Prisma Schema

The `version` field will be used to prevent race conditions when multiple users try to register for the same tournament simultaneously.

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
  version                 Int       @default(1) // For optimistic locking
  deleted_at              DateTime?
  created_at              DateTime  @default(now())
  updated_at              DateTime  @updatedAt

  registrations           Registration[] 

  @@map("tournaments")
}
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

  // Relation is now active
  registrations           Registration[] 

  @@map("tournaments")
}

model Registration {
  id                 String             @id @default(uuid())
  tournament         Tournament         @relation(fields: [tournament_id], references: [id])
  tournament_id      String
  competitor         User               @relation(fields: [competitor_id], references: [id])
  competitor_id      String
  status             RegistrationStatus
  type               RegistrationType

  sync               RegistrationSync?
  created_at         DateTime           @default(now())
  updated_at         DateTime           @updatedAt

  @@map("registrations")
  @@unique([tournament_id, competitor_id])
}

model RegistrationSync {
  id              String       @id @default(uuid())
  registration    Registration @relation(fields: [registration_id], references: [id])
  registration_id String       @unique
  status          SyncStatus   @default(PENDING)
  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt

  @@map("registration_syncs")
}

enum RegistrationType {
  INDIVIDUAL
}

enum RegistrationStatus {
  CONFIRMED
  CANCELLED
}

enum SyncStatus {
  PENDING
  SYNCED
  FAILED
}
```

### Relevant Files

- `prisma/schema.prisma`

## Success Criteria

- The `prisma migrate` command completes without errors.
- The new tables (`registrations`, `registration_syncs`) are created in the database.
- The `tournaments` table is updated with the new `version` column.
