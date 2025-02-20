import {
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { opt } from './opt';
import { kabupatenKota } from './kabupaten-kota';
import { relations } from 'drizzle-orm';
import { peramalanKecamatan } from './peramalan-kecamatan';

export const musimTanam = pgEnum('mt', ['mk', 'mh']);

export const peramalan = pgTable('peramalan', {
  id: serial('id').primaryKey(),
  kode_opt: text('kode_opt').references(() => opt.kode_opt, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  kabkot_id: text('kabkot_id').references(() => kabupatenKota.id),
  tahun_sebelumnya: integer('tahun_sebelumnya'),
  klts_sebelumnya: integer('klts_sebelumnya'),
  tahun_antara: text('tahun_antara'),
  klts_antara: integer('klts_antara'),
  mt: musimTanam('mt'),
  mt_tahun: integer('mt_tahun'),
  mt_min: integer('mt_min'),
  mt_prakiraan: integer('mt_prakiraan'),
  mt_max: integer('mt_max'),
  klts: integer('klts'),
  rasio: integer('rasio'),
  rasio_max: integer('rasio_max'),
  updated_date: date('updated_date').defaultNow(),
});

export const peramalanRelations = relations(peramalan, ({ one, many }) => ({
  kabupaten_kota: one(kabupatenKota, {
    fields: [peramalan.kabkot_id],
    references: [kabupatenKota.id],
  }),
  opt: one(opt, {
    fields: [peramalan.kode_opt],
    references: [opt.kode_opt],
  }),
  peramalan_kecamatan: many(peramalanKecamatan),
}));

export type SelectPeramalan = typeof peramalan.$inferSelect;
