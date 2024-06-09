import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { pengamatan } from "./pengamatan";

export const photoPengamatan = pgTable("photo_pengamatan", {
  id: serial("id").primaryKey(),
  path: text("path"),
  pengamatan_id: integer("pengamatan_id").references(() => pengamatan.id),
});
