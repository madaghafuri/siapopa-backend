// Organisme Penggerek Tanaman

import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { tanaman } from "./tanaman.js";

export const opt = pgTable("opt", {
  id: serial("id").primaryKey(),
  nama_opt: text("nama_opt"),
  status: text("status"),
  tanaman_id: integer("tanaman_id").references(() => tanaman.id),
});
