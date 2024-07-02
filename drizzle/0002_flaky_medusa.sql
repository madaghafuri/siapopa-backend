DO $$ BEGIN
 CREATE TYPE "public"."jenis" AS ENUM('opt', 'ma');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "kerusakan" ADD VALUE 'ma';--> statement-breakpoint
ALTER TABLE "detail_rumpun" DROP CONSTRAINT "detail_rumpun_hama_id_hama_id_fk";
--> statement-breakpoint
ALTER TABLE "opt" ADD COLUMN "jenis" "jenis";--> statement-breakpoint
ALTER TABLE "detail_rumpun" DROP COLUMN IF EXISTS "hama_id";--> statement-breakpoint
ALTER TABLE "detail_rumpun" DROP COLUMN IF EXISTS "jumlah_hama";