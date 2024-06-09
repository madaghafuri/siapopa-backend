import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const kategoriSerangan = pgTable("kategori_serangan", {
  id: serial("id").primaryKey(),
  jenis_serangan: text("jenis_serangan"),
});
