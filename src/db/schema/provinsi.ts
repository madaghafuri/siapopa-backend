import { geometry, pgTable, text } from 'drizzle-orm/pg-core';

export const provinsi = pgTable('provinsi', {
  id: text('id').primaryKey(),
  nama_provinsi: text('nama_provinsi'),
  point_provinsi: geometry('point_provinsi', { type: 'point' }),
  area_provinsi: geometry('area_provinsi'),
});

export type Provinsi = typeof provinsi.$inferSelect;
