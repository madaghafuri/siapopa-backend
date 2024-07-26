import { geometry, pgTable, text } from 'drizzle-orm/pg-core';
import { provinsi } from './provinsi';
import { relations, sql } from 'drizzle-orm';
import { geom } from '../custom-type';

export const kabupatenKota = pgTable('kabupaten_kota', {
  id: text('id').primaryKey().notNull(),
  nama_kabkot: text('nama_kabkot'),
  point_kabkot: geometry('point_kabkot', { type: 'point' }),
  area_kabkot: geom('area_kabkot'),
  provinsi_id: text('provinsi_id').references(() => provinsi.id),
});

export const kabupatenKotaRelations = relations(kabupatenKota, ({ one }) => ({
  provinsi: one(provinsi, {
    fields: [kabupatenKota.provinsi_id],
    references: [provinsi.id],
  }),
}));

export type KabupatenKota = typeof kabupatenKota.$inferSelect;
