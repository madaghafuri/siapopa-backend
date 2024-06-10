import { boolean, integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { laporanHarian } from "./laporan-harian";
import { laporanSb } from "./laporan-sb";
import { laporanBulanan } from "./laporan-bulanan";
import { laporanMusiman } from "./laporan-musiman";
import { kategoriLaporan } from "./kategori-laporan";

export const validasiLaporan = pgTable("validasi_laporan", {
  id: serial("id").primaryKey(),
  laporan_id: integer("laporan_id")
    .references(() => laporanHarian.id)
    .references(() => laporanSb.id)
    .references(() => laporanBulanan.id)
    .references(() => laporanMusiman.id),
  kategori_laporan_id: integer("kategori_laporan_id").references(
    () => kategoriLaporan.id
  ),
  validasi_satpel: boolean("validasi_satpel"),
  validasi_kortikab: boolean("validasi_kortikab"),
  validasi_bptph: boolean("validasi_bptph"),
  sign_satpel: text("sign_satpel"),
  sign_kortikab: text("sign_kortikab"),
  sign_bptph: text("sign_bptph"),
  note_satpel: text("note_satpel"),
  note_kortikab: text("note_kortikab"),
  note_bptph: text("note_bptph"),
});
