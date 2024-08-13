import { date, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { lokasi } from './lokasi';
import { golonganAph } from './golongan-aph';
import { bentukStockAph } from './bentuk-stok-aph';
import { relations } from 'drizzle-orm';
import { user } from './user';

export const stockAph = pgTable('stock_aph', {
  id: serial('id').primaryKey(),
  tahun_pelaksanaan: text('tahun_pelaksanaan'),
  bulan_pelaksanaan: text('bulan_pelaksanaan'),
  jenis: text('jenis'),
  lokasi_id: text('lokasi_id').references(() => lokasi.id),
  golongan_aph_id: integer('golongan_aph_id').references(() => golonganAph.id),
  bentuk_aph_id: integer('bentuk_aph_id').references(() => bentukStockAph.id),
  sisa_volume: integer('sisa_volume'),
  volume_produksi: integer('volume_produksi'),
  tanggal_produksi: date('tanggal_produksi'),
  volume_distribusi: integer('volume_distribusi'),
  tanggal_distribusi: date('tanggal_distribusi'),
  keterangan_kegiatan: text('keterangan_kegiatan'),
  tanggal_expired: date('tanggal_expired'),
  satpel_id: integer('satpel_id').references(() => user.id),
});

export const aphRelations = relations(stockAph, ({ one }) => ({
  lokasi: one(lokasi, {
    fields: [stockAph.lokasi_id],
    references: [lokasi.id],
  }),
  satpel: one(user, {
    fields: [stockAph.satpel_id],
    references: [user.id],
  }),
  golongan_aph: one(golonganAph, {
    fields: [stockAph.golongan_aph_id],
    references: [golonganAph.id],
  }),
  bentuk_aph: one(bentukStockAph, {
    fields: [stockAph.bentuk_aph_id],
    references: [bentukStockAph.id],
  }),
}));

export type SelectStockAph = typeof stockAph.$inferSelect;
export type InsertStockAph = typeof stockAph.$inferInsert;
