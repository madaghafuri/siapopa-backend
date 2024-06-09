import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { provinsi } from "./provinsi";
import { kabupatenKota } from "./kabupaten-kota";
import { kecamatan } from "./kecamatan";
import { desa } from "./desa";
import { user } from "./user";

export const lokasi = pgTable("lokasi", {
  id: serial("id").primaryKey(),
  alamat: text("alamat"),
  kode_post: text("kode_post"),
  provinsi_id: text("provinsi_id").references(() => provinsi.id),
  kabkot_id: text("kabkot_id").references(() => kabupatenKota.id),
  kecamatan_id: text("kecamatan_id").references(() => kecamatan.id),
  desa_id: text("desa_id").references(() => desa.id),
  pic_id: integer("pic_id").references(() => user.id),
});
