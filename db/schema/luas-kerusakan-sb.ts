import { integer, pgTable, serial } from "drizzle-orm/pg-core";
import { kategoriSerangan } from "./kategori-serangan";
import { kategoriKerusakan } from "./kategori-kerusakan";
import { laporanSb } from "./laporan-sb";

export const luasKerusakanSb = pgTable("luas_kerusakan_sb", {
  id: serial("id").primaryKey(),
  serangan_id: integer("serangan_id").references(() => kategoriSerangan.id),
  kerusakan_id: integer("kerusakan_id").references(() => kategoriKerusakan.id),
  luas_kerusakan: integer("luas_kerusakan"),
  laporan_sb_id: integer("laporan_sb_id").references(() => laporanSb.id),
});
