-- CreateEnum
CREATE TYPE "public"."RegistrationType" AS ENUM ('INDIVIDUAL');

-- CreateEnum
CREATE TYPE "public"."RegistrationStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- AlterTable
ALTER TABLE "public"."tournament" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "public"."registrations" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "competitor_id" TEXT NOT NULL,
    "status" "public"."RegistrationStatus" NOT NULL,
    "type" "public"."RegistrationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."registration_syncs" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "status" "public"."SyncStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registrations_tournament_id_competitor_id_key" ON "public"."registrations"("tournament_id", "competitor_id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_syncs_registration_id_key" ON "public"."registration_syncs"("registration_id");

-- AddForeignKey
ALTER TABLE "public"."registrations" ADD CONSTRAINT "registrations_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registrations" ADD CONSTRAINT "registrations_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registration_syncs" ADD CONSTRAINT "registration_syncs_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
