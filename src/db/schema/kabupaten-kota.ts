import { geometry, pgTable, text } from "drizzle-orm/pg-core";
import { provinsi } from "./provinsi.js";

export const kabupatenKota = pgTable("kabupaten_kota", {
  id: text("id").primaryKey().notNull(),
  nama_kabkot: text("nama_kabkot"),
  point_kabkot: geometry("point_kabkot", { type: "point" }),
  area_kabkot: geometry("area_kabkot", { type: "polygon" }),
  provinsi_id: text("provinsi_id").references(() => provinsi.id),
});

export type KabupatenKota = typeof kabupatenKota.$inferSelect;
