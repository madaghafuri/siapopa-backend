import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { desa } from './desa';
import { lokasi } from './lokasi';
import { rekomendasiPOPT } from './rekomendasi-popt';

export const rincianRekomendasiPOPT = pgTable('rincian_rekomendasi_popt', {
  id: serial('id').primaryKey(),
  rekomendasi_popt_id: integer('rekomendasi_popt_id').references(
    () => rekomendasiPOPT.id
  ),
  desa_id: text('desa_id').references(() => desa.id),
  lokasi_id: text('lokasi_id').references(() => lokasi.id),
  luas_serangan: integer('luas_serangan'),
  created_at: timestamp('created_at').defaultNow(),
});

export type InsertRincianRekomendasiPOPT =
  typeof rincianRekomendasiPOPT.$inferInsert;
export type SelectRincianRekomendasiPOPT =
  typeof rincianRekomendasiPOPT.$inferSelect;
