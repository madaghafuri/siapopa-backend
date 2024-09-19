import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { opt } from './opt';
import { peramalan } from './peramalan';
import { kecamatan } from './kecamatan';
import { relations } from 'drizzle-orm';

export const peramalanKecamatan = pgTable('peramalan_kecamatan', {
  id: serial('id').primaryKey(),
  opt_id: integer('opt_id').references(() => opt.id),
  peramalan_id: integer('peramalan_id').references(() => peramalan.id),
  kecamatan_id: text('kecamatan_id').references(() => kecamatan.id),
  mt_sebelumnya: integer('mt_sebelumnya'),
  mt_antara: text('mt_antara'),
  mt_prakiraan: integer('mt'),
  klts_sebelumnya: integer('klts_sebelumnya'),
  klts_antara: integer('klts_antara'),
  klts_prakiraan: integer('klts'),
  proporsi: integer('proporsi'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at', { mode: 'date', precision: 3 }).$onUpdate(
    () => new Date()
  ),
});

export const peramalanKecamatanRelations = relations(
  peramalanKecamatan,
  ({ one }) => ({
    peramalan: one(peramalan, {
      fields: [peramalanKecamatan.peramalan_id],
      references: [peramalan.id],
    }),
    opt: one(opt, {
      fields: [peramalanKecamatan.opt_id],
      references: [opt.id],
    }),
    kecamatan: one(kecamatan, {
      fields: [peramalanKecamatan.kecamatan_id],
      references: [kecamatan.id],
    }),
  })
);

export type SelectPeramalanKecamatan = typeof peramalanKecamatan.$inferSelect;
export type InsertPeramalanKecamatan = typeof peramalanKecamatan.$inferInsert;
