import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { tanaman } from "./tanaman.js";

export const makhlukAsing = pgTable("makhluk_asing", {
  id: serial("id").primaryKey(),
  opt: text("opt"),
  ma: text("ma"),
  tanaman_id: integer("tanaman_id").references(() => tanaman.id),
});
