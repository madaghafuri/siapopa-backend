import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { tanaman } from "./tanaman.js";

export const hama = pgTable("hama", {
  id: serial("id").primaryKey(),
  hama: text("hama"),
  tanaman_id: integer("tanaman_id").references(() => tanaman.id),
});

export type SelectHama = typeof hama.$inferSelect;
export type InsertHama = typeof hama.$inferInsert;
