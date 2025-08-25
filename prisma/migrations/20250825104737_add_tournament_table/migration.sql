-- CreateEnum
CREATE TYPE "public"."TournamentType" AS ENUM ('INDIVIDUAL', 'DUO');

-- CreateTable
CREATE TABLE "public"."tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."TournamentType" NOT NULL,
    "registration_start_date" TIMESTAMP(3) NOT NULL,
    "registration_end_date" TIMESTAMP(3) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_pkey" PRIMARY KEY ("id")
);
