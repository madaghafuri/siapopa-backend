import { geometry, pgTable, serial, text } from "drizzle-orm/pg-core";

export const provinsi = pgTable("provinsi", {
  id: text("id").primaryKey(),
  nama_provinsi: text("nama_provinsi"),
  point_provinsi: geometry("point_provinsi", { type: "point" }),
  area_provinsi: geometry("area_provinsi"),
});
