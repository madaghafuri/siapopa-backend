import { boolean, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { laporanHarian } from './laporan-harian';
import { laporanSb } from './laporan-sb';
import { laporanBulanan } from './laporan-bulanan';
import { laporanMusiman } from './laporan-musiman';
import { kategoriLaporan } from './kategori-laporan';
import { validator } from './validator';
import { relations } from 'drizzle-orm';

export const validasiLaporan = pgTable('validasi_laporan', {
  id: serial('id').primaryKey(),
  laporan_harian_id: integer('laporan_harian_id').references(
    () => laporanHarian.id,
    { onDelete: 'cascade' }
  ),
  laporan_sb_id: integer('laporan_sb_id').references(() => laporanSb.id, {
    onDelete: 'cascade',
  }),
  laporan_bulanan_id: integer('laporan_bulanan_id').references(
    () => laporanBulanan.id,
    { onDelete: 'cascade' }
  ),
  laporan_musiman_id: integer('laporan_musiman_id').references(
    () => laporanMusiman.id,
    { onDelete: 'cascade' }
  ),
  kategori_laporan_id: integer('kategori_laporan_id').references(
    () => kategoriLaporan.id,
    { onDelete: 'cascade' }
  ),
});

export const validasiLaporanRelations = relations(
  validasiLaporan,
  ({ many }) => ({
    validator: many(validator),
  })
);

export type SelectValidasiLaporan = typeof validasiLaporan.$inferSelect;
