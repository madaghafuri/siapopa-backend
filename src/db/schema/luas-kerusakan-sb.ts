import { integer, pgEnum, pgTable, serial } from 'drizzle-orm/pg-core';
import { laporanSb } from './laporan-sb';
import { relations } from 'drizzle-orm';

export const serangan = pgEnum('kategori_serangan', [
  'sisa serangan',
  'tambah serangan',
  'keadaan serangan',
]);
export const kategoriKerusakan = pgEnum('kategori_kerusakan', [
  'ringan',
  'sedang',
  'berat',
  'puso',
]);

export const luasKerusakanSb = pgTable('luas_kerusakan_sb', {
  id: serial('id').primaryKey(),
  kategori_serangan: serangan('kategori_serangan'),
  kategori_kerusakan: kategoriKerusakan('kategori_kerusakan'),
  luas_kerusakan: integer('luas_kerusakan'),
  laporan_sb_id: integer('laporan_sb_id').references(() => laporanSb.id),
});

export type LuasKerusakanSb = typeof luasKerusakanSb.$inferSelect;

export const luasKerusakanSbRelations = relations(
  luasKerusakanSb,
  ({ one }) => ({
    laporan_sb: one(laporanSb, {
      fields: [luasKerusakanSb.laporan_sb_id],
      references: [laporanSb.id],
    }),
  })
);

export type KategoriSerangan =
  | 'sisa serangan'
  | 'tambah serangan'
  | 'keadaan serangan';
export type KategoriKerusakan = 'ringan' | 'sedang' | 'berat' | 'puso';
