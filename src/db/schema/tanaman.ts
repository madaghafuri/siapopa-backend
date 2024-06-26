import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const tanaman = pgTable("tanaman", {
  id: serial("id").primaryKey(),
  nama_tanaman: varchar("nama_tanaman", { length: 255 }),
});

export type SelectTanaman = typeof tanaman.$inferSelect;
export type InsertTanaman = typeof tanaman.$inferInsert;
