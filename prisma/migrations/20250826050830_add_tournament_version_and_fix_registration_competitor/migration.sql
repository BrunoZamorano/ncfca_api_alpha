-- DropForeignKey
ALTER TABLE "public"."registrations" DROP CONSTRAINT "registrations_competitor_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."registrations" ADD CONSTRAINT "registrations_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "public"."Dependant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
