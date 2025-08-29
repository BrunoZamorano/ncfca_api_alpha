-- Add new enum values to RegistrationStatus
ALTER TYPE "public"."RegistrationStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "public"."RegistrationStatus" ADD VALUE 'REJECTED';

-- Add new columns to registrations table
ALTER TABLE "public"."registrations" 
  ADD COLUMN "partner_id" TEXT,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- Drop the old unique constraint
DROP INDEX "registrations_tournament_id_competitor_id_key";

-- Convert the type column from RegistrationType to TournamentType
-- (TournamentType already exists, just need to convert the column)
ALTER TABLE "public"."registrations" 
  ALTER COLUMN "type" TYPE "public"."TournamentType" 
  USING "type"::text::"public"."TournamentType";

-- Drop the old enum type
DROP TYPE "public"."RegistrationType";

-- Create new unique constraint including partner_id
CREATE UNIQUE INDEX "registrations_tournament_id_competitor_id_partner_id_key" 
  ON "public"."registrations"("tournament_id", "competitor_id", "partner_id");