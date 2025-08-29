-- DropForeignKey
ALTER TABLE "public"."registrations" DROP CONSTRAINT "registrations_partner_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."registrations" ADD CONSTRAINT "registrations_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."Dependant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
