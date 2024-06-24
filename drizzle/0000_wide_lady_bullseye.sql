DO $$ BEGIN
 CREATE TYPE "public"."kerusakan" AS ENUM('mutlak', 'tidak mutlak', 'ekor/rumpun', 'ekor/m2');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."kategori_kerusakan" AS ENUM('ringan', 'sedang', 'berat', 'puso');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."kategori_serangan" AS ENUM('sisa serangan', 'tambah serangan', 'keadaan serangan');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "desa" (
	"id" text PRIMARY KEY NOT NULL,
	"nama_desa" text,
	"point_desa" geometry(point),
	"area_desa" geometry(point),
	"provinsi_id" text,
	"kabkot_id" text,
	"kecamatan_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "detail_rumpun" (
	"id" serial PRIMARY KEY NOT NULL,
	"rumpun_id" integer,
	"opt_id" integer,
	"jumlah_opt" integer,
	"skala_kerusakan" "kerusakan",
	"hama_id" integer,
	"jumlah_hama" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kabupaten_kota" (
	"id" text PRIMARY KEY NOT NULL,
	"nama_kabkot" text,
	"point_kabkot" geometry(point),
	"area_kabkot" geometry(point),
	"provinsi_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kategori_laporan" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipe_laporan" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kecamatan" (
	"id" text PRIMARY KEY NOT NULL,
	"nama_kecamatan" text,
	"point_kecamatan" geometry(point),
	"area_kecamatan" geometry(point),
	"provinsi_id" text,
	"kabkot_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "laporan_bulanan" (
	"id" serial PRIMARY KEY NOT NULL,
	"opt_id" integer,
	"laporan_musiman_id" integer,
	"tanggal_laporan_bulanan" date DEFAULT now(),
	"point" geometry(point),
	"periode_laporan_bulanan" integer,
	"note" text,
	"pic_id" integer,
	"sign_pic" text,
	"status_laporan_musiman" boolean DEFAULT false,
	"start_date" date,
	"end_date" date
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "laporan_harian" (
	"id" serial PRIMARY KEY NOT NULL,
	"pengamatan_id" integer,
	"opt_id" integer,
	"tanggal_laporan_harian" date DEFAULT now(),
	"point_laporan_harian" geometry(point),
	"luas_waspada" integer,
	"rekomendasi_pengendalian" text,
	"id_laporan_sb" integer,
	"pic_id" integer,
	"sign_pic" text,
	"status_laporan_sb" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "laporan_musiman" (
	"id" serial PRIMARY KEY NOT NULL,
	"opt_id" integer,
	"tanggal" date DEFAULT now(),
	"point" geometry(point),
	"periode" integer,
	"note" text,
	"pic_id" integer,
	"sign_pic" text,
	"start_date" date,
	"end_date" date
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "laporan_sb" (
	"id" serial PRIMARY KEY NOT NULL,
	"opt_id" integer,
	"laporan_bulanan_id" integer,
	"tanggal_laporan_sb" date DEFAULT now(),
	"point_laporan_sb" geometry(point),
	"periode_laporan_sb" integer,
	"luas_sembuh" integer,
	"luas_panen" integer,
	"freq_pengendalian" integer,
	"freq_nabati" integer,
	"note" text,
	"pic_id" integer,
	"sign_pic" text,
	"status_laporan_bulanan" boolean DEFAULT false,
	"start_date" date,
	"end_date" date
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lokasi" (
	"id" text PRIMARY KEY NOT NULL,
	"alamat" text,
	"kode_post" text,
	"provinsi_id" text,
	"kabkot_id" text,
	"kecamatan_id" text,
	"desa_id" text,
	"pic_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "luas_kerusakan_sb" (
	"id" serial PRIMARY KEY NOT NULL,
	"kategori_serangan" "kategori_serangan",
	"kategori_kerusakan" "kategori_kerusakan",
	"luas_kerusakan" integer,
	"laporan_sb_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "makhluk_asing" (
	"id" serial PRIMARY KEY NOT NULL,
	"opt" text,
	"ma" text,
	"tanaman_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opt" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_opt" text,
	"status" text,
	"tanaman_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pengamatan" (
	"id" serial PRIMARY KEY NOT NULL,
	"tanaman_id" integer,
	"lokasi_id" text,
	"hari_ke" integer NOT NULL,
	"blok" text,
	"luas_hamparan" integer,
	"luas_diamati" integer,
	"luas_hasil_panen" integer,
	"luas_persemaian" integer,
	"ph_tanah" numeric,
	"komoditas" text,
	"varietas" text,
	"dari_umur" integer,
	"hingga_umur" integer,
	"pola_tanam" text,
	"pic_id" integer,
	"sign_pic" text,
	"tanggal_pengamatan" date DEFAULT now(),
	"point_pengamatan" geometry(point),
	"status_laporan_harian" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "photo_pengamatan" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text,
	"pengamatan_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "provinsi" (
	"id" text PRIMARY KEY NOT NULL,
	"nama_provinsi" text,
	"point_provinsi" geometry(point),
	"area_provinsi" geometry(point)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rumpun" (
	"id" serial PRIMARY KEY NOT NULL,
	"pengamatan_id" integer,
	"rumpun_ke" integer,
	"jumlah_anakan" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tanaman" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_tanaman" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_group" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_name" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text,
	"phone" text,
	"name" varchar(255),
	"password" varchar(255) NOT NULL,
	"photo" varchar(255),
	"validasi" boolean,
	"usergroup_id" integer,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "validasi_laporan" (
	"id" serial PRIMARY KEY NOT NULL,
	"laporan_id" integer,
	"kategori_laporan_id" integer,
	"validasi_satpel" boolean,
	"validasi_kortikab" boolean,
	"validasi_bptph" boolean,
	"sign_satpel" text,
	"sign_kortikab" text,
	"sign_bptph" text,
	"note_satpel" text,
	"note_kortikab" text,
	"note_bptph" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "desa" ADD CONSTRAINT "desa_provinsi_id_provinsi_id_fk" FOREIGN KEY ("provinsi_id") REFERENCES "public"."provinsi"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "desa" ADD CONSTRAINT "desa_kabkot_id_kabupaten_kota_id_fk" FOREIGN KEY ("kabkot_id") REFERENCES "public"."kabupaten_kota"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "desa" ADD CONSTRAINT "desa_kecamatan_id_kecamatan_id_fk" FOREIGN KEY ("kecamatan_id") REFERENCES "public"."kecamatan"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "detail_rumpun" ADD CONSTRAINT "detail_rumpun_rumpun_id_rumpun_id_fk" FOREIGN KEY ("rumpun_id") REFERENCES "public"."rumpun"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "detail_rumpun" ADD CONSTRAINT "detail_rumpun_opt_id_opt_id_fk" FOREIGN KEY ("opt_id") REFERENCES "public"."opt"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "detail_rumpun" ADD CONSTRAINT "detail_rumpun_hama_id_makhluk_asing_id_fk" FOREIGN KEY ("hama_id") REFERENCES "public"."makhluk_asing"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kabupaten_kota" ADD CONSTRAINT "kabupaten_kota_provinsi_id_provinsi_id_fk" FOREIGN KEY ("provinsi_id") REFERENCES "public"."provinsi"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kecamatan" ADD CONSTRAINT "kecamatan_provinsi_id_provinsi_id_fk" FOREIGN KEY ("provinsi_id") REFERENCES "public"."provinsi"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kecamatan" ADD CONSTRAINT "kecamatan_kabkot_id_kabupaten_kota_id_fk" FOREIGN KEY ("kabkot_id") REFERENCES "public"."kabupaten_kota"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laporan_bulanan" ADD CONSTRAINT "laporan_bulanan_opt_id_opt_id_fk" FOREIGN KEY ("opt_id") REFERENCES "public"."opt"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laporan_bulanan" ADD CONSTRAINT "laporan_bulanan_laporan_musiman_id_laporan_musiman_id_fk" FOREIGN KEY ("laporan_musiman_id") REFERENCES "public"."laporan_musiman"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laporan_bulanan" ADD CONSTRAINT "laporan_bulanan_pic_id_users_id_fk" FOREIGN KEY ("pic_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laporan_harian" ADD CONSTRAINT "laporan_harian_pengamatan_id_pengamatan_id_fk" FOREIGN KEY ("pengamatan_id") REFERENCES "public"."pengamatan"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laporan_harian" ADD CONSTRAINT "laporan_harian_opt_id_opt_id_fk" FOREIGN KEY ("opt_id") REFERENCES "public"."opt"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laporan_harian" ADD CONSTRAINT "laporan_harian_id_laporan_sb_laporan_sb_id_fk" FOREIGN KEY ("id_laporan_sb") REFERENCES "public"."laporan_sb"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laporan_harian" ADD CONSTRAINT "laporan_harian_pic_id_users_id_fk" FOREIGN KEY ("pic_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laporan_musiman" ADD CONSTRAINT "laporan_musiman_opt_id_opt_id_fk" FOREIGN KEY ("opt_id") REFERENCES "public"."opt"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laporan_musiman" ADD CONSTRAINT "laporan_musiman_pic_id_users_id_fk" FOREIGN KEY ("pic_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laporan_sb" ADD CONSTRAINT "laporan_sb_opt_id_opt_id_fk" FOREIGN KEY ("opt_id") REFERENCES "public"."opt"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laporan_sb" ADD CONSTRAINT "laporan_sb_laporan_bulanan_id_laporan_bulanan_id_fk" FOREIGN KEY ("laporan_bulanan_id") REFERENCES "public"."laporan_bulanan"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laporan_sb" ADD CONSTRAINT "laporan_sb_pic_id_users_id_fk" FOREIGN KEY ("pic_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lokasi" ADD CONSTRAINT "lokasi_provinsi_id_provinsi_id_fk" FOREIGN KEY ("provinsi_id") REFERENCES "public"."provinsi"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lokasi" ADD CONSTRAINT "lokasi_kabkot_id_kabupaten_kota_id_fk" FOREIGN KEY ("kabkot_id") REFERENCES "public"."kabupaten_kota"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lokasi" ADD CONSTRAINT "lokasi_kecamatan_id_kecamatan_id_fk" FOREIGN KEY ("kecamatan_id") REFERENCES "public"."kecamatan"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lokasi" ADD CONSTRAINT "lokasi_desa_id_desa_id_fk" FOREIGN KEY ("desa_id") REFERENCES "public"."desa"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lokasi" ADD CONSTRAINT "lokasi_pic_id_users_id_fk" FOREIGN KEY ("pic_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "luas_kerusakan_sb" ADD CONSTRAINT "luas_kerusakan_sb_laporan_sb_id_laporan_sb_id_fk" FOREIGN KEY ("laporan_sb_id") REFERENCES "public"."laporan_sb"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "makhluk_asing" ADD CONSTRAINT "makhluk_asing_tanaman_id_tanaman_id_fk" FOREIGN KEY ("tanaman_id") REFERENCES "public"."tanaman"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opt" ADD CONSTRAINT "opt_tanaman_id_tanaman_id_fk" FOREIGN KEY ("tanaman_id") REFERENCES "public"."tanaman"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pengamatan" ADD CONSTRAINT "pengamatan_tanaman_id_tanaman_id_fk" FOREIGN KEY ("tanaman_id") REFERENCES "public"."tanaman"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pengamatan" ADD CONSTRAINT "pengamatan_lokasi_id_lokasi_id_fk" FOREIGN KEY ("lokasi_id") REFERENCES "public"."lokasi"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pengamatan" ADD CONSTRAINT "pengamatan_pic_id_users_id_fk" FOREIGN KEY ("pic_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "photo_pengamatan" ADD CONSTRAINT "photo_pengamatan_pengamatan_id_pengamatan_id_fk" FOREIGN KEY ("pengamatan_id") REFERENCES "public"."pengamatan"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rumpun" ADD CONSTRAINT "rumpun_pengamatan_id_pengamatan_id_fk" FOREIGN KEY ("pengamatan_id") REFERENCES "public"."pengamatan"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_usergroup_id_user_group_id_fk" FOREIGN KEY ("usergroup_id") REFERENCES "public"."user_group"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "validasi_laporan" ADD CONSTRAINT "validasi_laporan_laporan_id_laporan_harian_id_fk" FOREIGN KEY ("laporan_id") REFERENCES "public"."laporan_harian"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "validasi_laporan" ADD CONSTRAINT "validasi_laporan_laporan_id_laporan_sb_id_fk" FOREIGN KEY ("laporan_id") REFERENCES "public"."laporan_sb"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "validasi_laporan" ADD CONSTRAINT "validasi_laporan_laporan_id_laporan_bulanan_id_fk" FOREIGN KEY ("laporan_id") REFERENCES "public"."laporan_bulanan"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "validasi_laporan" ADD CONSTRAINT "validasi_laporan_laporan_id_laporan_musiman_id_fk" FOREIGN KEY ("laporan_id") REFERENCES "public"."laporan_musiman"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "validasi_laporan" ADD CONSTRAINT "validasi_laporan_kategori_laporan_id_kategori_laporan_id_fk" FOREIGN KEY ("kategori_laporan_id") REFERENCES "public"."kategori_laporan"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "emailIndex" ON "users" USING btree ("email");