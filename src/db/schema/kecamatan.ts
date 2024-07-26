import { geometry, pgTable, text } from 'drizzle-orm/pg-core';
import { provinsi } from './provinsi';
import { kabupatenKota } from './kabupaten-kota';
import { geom } from '../custom-type';

export const kecamatan = pgTable('kecamatan', {
  id: text('id').primaryKey(),
  nama_kecamatan: text('nama_kecamatan'),
  point_kecamatan: geometry('point_kecamatan', { type: 'point' }),
  area_kecamatan: geom('area_kecamatan'),
  provinsi_id: text('provinsi_id').references(() => provinsi.id),
  kabkot_id: text('kabkot_id').references(() => kabupatenKota.id),
});

export type Kecamatan = typeof kecamatan.$inferSelect;
