import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { desa } from './desa';
import { lokasi } from './lokasi';
import { rekomendasiPOPT } from './rekomendasi-popt';
import { relations } from 'drizzle-orm';

export const rincianRekomendasiPOPT = pgTable('rincian_rekomendasi_popt', {
  id: serial('id').primaryKey(),
  rekomendasi_popt_id: integer('rekomendasi_popt_id').references(
    () => rekomendasiPOPT.id,
    { onDelete: 'cascade' }
  ),
  desa_id: text('desa_id').references(() => desa.id),
  lokasi_id: text('lokasi_id').references(() => lokasi.id),
  luas_serangan: integer('luas_serangan'),
  created_at: timestamp('created_at').defaultNow(),
});

export const rincianRekomendasiRelations = relations(
  rincianRekomendasiPOPT,
  ({ one, many }) => ({
    desa: one(desa, {
      fields: [rincianRekomendasiPOPT.desa_id],
      references: [desa.id],
    }),
    lokasi: one(lokasi, {
      fields: [rincianRekomendasiPOPT.lokasi_id],
      references: [lokasi.id],
    }),
    rekomendasi_popt: one(rekomendasiPOPT, {
      fields: [rincianRekomendasiPOPT.rekomendasi_popt_id],
      references: [rekomendasiPOPT.id],
    }),
  })
);

export type InsertRincianRekomendasiPOPT =
  typeof rincianRekomendasiPOPT.$inferInsert;
export type SelectRincianRekomendasiPOPT =
  typeof rincianRekomendasiPOPT.$inferSelect;
