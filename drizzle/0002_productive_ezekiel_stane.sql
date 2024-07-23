DO $$ BEGIN
 CREATE TYPE "public"."satuan_pestisida" AS ENUM('kg', 'liter', 'batang');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "golongan_pestisida" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_golongan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pestisida" (
	"id" serial PRIMARY KEY NOT NULL,
	"satuan" "satuan_pestisida",
	"opt_id" integer,
	"tanaman_id" integer,
	"volume" integer,
	"lokasi_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pestisida" ADD CONSTRAINT "pestisida_opt_id_opt_id_fk" FOREIGN KEY ("opt_id") REFERENCES "public"."opt"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pestisida" ADD CONSTRAINT "pestisida_tanaman_id_tanaman_id_fk" FOREIGN KEY ("tanaman_id") REFERENCES "public"."tanaman"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pestisida" ADD CONSTRAINT "pestisida_lokasi_id_lokasi_id_fk" FOREIGN KEY ("lokasi_id") REFERENCES "public"."lokasi"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
