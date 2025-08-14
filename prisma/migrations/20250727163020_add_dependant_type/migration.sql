-- CreateEnum
CREATE TYPE "DependantType" AS ENUM ('STUDENT', 'ALUMNI', 'PARENT');

-- AlterTable
ALTER TABLE "Dependant" ADD COLUMN     "type" "DependantType" NOT NULL DEFAULT 'STUDENT';
