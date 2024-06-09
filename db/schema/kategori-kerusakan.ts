import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const kategoriKerusakan = pgTable("kategori_kerusakan", {
  id: serial("id").primaryKey(),
  jenis_kategori: text("jenis_kategori"),
});
