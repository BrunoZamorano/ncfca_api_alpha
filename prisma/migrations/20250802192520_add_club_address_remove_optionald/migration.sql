/*
  Warnings:

  - You are about to drop the column `complement` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `neighborhood` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `zip_code` on the `Club` table. All the data in the column will be lost.
  - Made the column `city` on table `Club` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `Club` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Club" DROP COLUMN "complement",
DROP COLUMN "neighborhood",
DROP COLUMN "number",
DROP COLUMN "street",
DROP COLUMN "zip_code",
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "city" DROP DEFAULT,
ALTER COLUMN "state" SET NOT NULL,
ALTER COLUMN "state" DROP DEFAULT;
