import { date, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { rekomendasiPOPT } from './rekomendasi-popt';

export const pengajuanPestisida = pgTable('pengajuan_pestisida', {
  id: serial('id').primaryKey(),
  tanggal_pengajuan: date('tanggal_pengajuan'),
  sign_brigade: text('sign_brigade'),
  lampiran: text('lampiran'),
  surat_pengajuan: text('surat_pengajuan'),
  created_at: timestamp('created_at').defaultNow(),
});

export const pengajuanPestisidaRelations = relations(
  pengajuanPestisida,
  ({ many }) => ({
    rekomendasi_popt: many(rekomendasiPOPT),
  })
);

export type InsertPengajuanPestisida = typeof pengajuanPestisida.$inferInsert;
export type SelectPengajuanPestisida = typeof pengajuanPestisida.$inferSelect;
