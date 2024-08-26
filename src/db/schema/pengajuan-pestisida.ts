import { date, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { kecamatan } from './kecamatan';
import { opt } from './opt';
import { relations } from 'drizzle-orm';
import { rincianPengajuanPestisida } from './rincian-pengajuan-pestisida';

export const pengajuanPestisida = pgTable('pengajuan_pestisida', {
  id: serial('id').primaryKey(),
  kecamatan_id: text('kecamatan_id').references(() => kecamatan.id),
  opt_id: integer('opt_id').references(() => opt.id),
  tanggal_pengajuan: date('tanggal_pengajuan').defaultNow(),
  bptph_id: integer('bptph_id'),
  sign_bptph: text('sign_bptph'),
  lampiran: text('lampiran'),
});

export const pengajuanPestisidaRelations = relations(
  pengajuanPestisida,
  ({ many }) => ({
    rincian: many(rincianPengajuanPestisida),
  })
);

export type InsertPengajuanPestisida = typeof pengajuanPestisida.$inferInsert;
export type SelectPengajuanPestisida = typeof pengajuanPestisida.$inferSelect;
