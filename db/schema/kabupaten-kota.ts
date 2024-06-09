import { geometry, integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { provinsi } from "./provinsi";

export const kabupatenKota = pgTable("kabupaten_kota", {
  id: text("id").primaryKey(),
  nama_kabkot: text("nama_kabkot"),
  point_kabkot: geometry("point_kabkot", { type: "point" }),
  area_kabkot: geometry("area_kabkot", { type: "polygon" }),
  provinsi_id: text("provinsi_id").references(() => provinsi.id),
});
