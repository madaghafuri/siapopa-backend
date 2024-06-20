import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { pengamatan } from "./pengamatan.js";

export const rumpun = pgTable("rumpun", {
  id: serial("id").primaryKey(),
  pengamatan_id: integer("pengamatan_id").references(() => pengamatan.id),
  rumpun_ke: integer("rumpun_ke"),
  jumlah_anakan: integer("jumlah_anakan"),
});

export type InsertRumpun = typeof rumpun.$inferInsert;
