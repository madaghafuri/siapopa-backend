import { geometry, pgTable, text } from "drizzle-orm/pg-core";
import { provinsi } from "./provinsi.js";
import { kabupatenKota } from "./kabupaten-kota.js";

export const kecamatan = pgTable("kecamatan", {
  id: text("id").primaryKey(),
  nama_kecamatan: text("nama_kecamatan"),
  point_kecamatan: geometry("point_kecamatan", { type: "point" }),
  area_kecamatan: geometry("area_kecamatan", { type: "polygon" }),
  provinsi_id: text("provinsi_id").references(() => provinsi.id),
  kabkot_id: text("kabkot_id").references(() => kabupatenKota.id),
});

export type Kecamatan = typeof kecamatan.$inferSelect;
