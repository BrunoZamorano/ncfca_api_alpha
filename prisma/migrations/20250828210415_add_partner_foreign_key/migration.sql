-- Add foreign key constraint for partner_id referencing Dependant table
ALTER TABLE "public"."registrations" 
  ADD CONSTRAINT "registrations_partner_id_fkey" 
  FOREIGN KEY ("partner_id") 
  REFERENCES "public"."Dependant"("id") 
  ON DELETE RESTRICT ON UPDATE CASCADE;