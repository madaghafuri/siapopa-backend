import { geometry, pgTable, text } from 'drizzle-orm/pg-core';
import { provinsi } from './provinsi';
import { kabupatenKota } from './kabupaten-kota';
import { kecamatan } from './kecamatan';
import { geom } from '../custom-type';

export const desa = pgTable('desa', {
  id: text('id').primaryKey(),
  nama_desa: text('nama_desa'),
  point_desa: geometry('point_desa', { type: 'point' }),
  area_desa: geom('area_desa'),
  provinsi_id: text('provinsi_id').references(() => provinsi.id),
  kabkot_id: text('kabkot_id').references(() => kabupatenKota.id),
  kecamatan_id: text('kecamatan_id').references(() => kecamatan.id),
});

export type Desa = typeof desa.$inferSelect;
