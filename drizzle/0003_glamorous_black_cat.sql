ALTER TABLE "pestisida" ADD COLUMN "golongan_pestisida_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pestisida" ADD CONSTRAINT "pestisida_golongan_pestisida_id_golongan_pestisida_id_fk" FOREIGN KEY ("golongan_pestisida_id") REFERENCES "public"."golongan_pestisida"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
