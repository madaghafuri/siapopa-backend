import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const kategoriLaporan = pgTable("kategori_laporan", {
  id: serial("id").primaryKey(),
  tipe_laporan: text("tipe_laporan"),
});
