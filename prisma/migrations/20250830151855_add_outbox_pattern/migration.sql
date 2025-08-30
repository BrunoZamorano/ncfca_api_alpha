-- AlterTable
ALTER TABLE "public"."registration_syncs" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_attempt_at" TIMESTAMP(3),
ADD COLUMN     "next_attempt_at" TIMESTAMP(3);
