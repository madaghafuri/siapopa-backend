import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { provinsi } from './provinsi';
import { kabupatenKota } from './kabupaten-kota';
import { kecamatan } from './kecamatan';
import { desa } from './desa';
import { user } from './user';
import { relations } from 'drizzle-orm';

export const lokasi = pgTable('lokasi', {
  id: text('id').primaryKey(),
  alamat: text('alamat'),
  kode_post: text('kode_post'),
  provinsi_id: text('provinsi_id').references(() => provinsi.id),
  kabkot_id: text('kabkot_id').references(() => kabupatenKota.id),
  kecamatan_id: text('kecamatan_id').references(() => kecamatan.id),
  desa_id: text('desa_id').references(() => desa.id),
  pic_id: integer('pic_id').references(() => user.id),
});

export const lokasiRelations = relations(lokasi, ({ one }) => ({
  user: one(user, {
    fields: [lokasi.pic_id],
    references: [user.id],
  }),
  provinsi: one(provinsi, {
    fields: [lokasi.provinsi_id],
    references: [provinsi.id],
  }),
  kabkot: one(kabupatenKota, {
    fields: [lokasi.kabkot_id],
    references: [kabupatenKota.id],
  }),
  kecamatan: one(kecamatan, {
    fields: [lokasi.kecamatan_id],
    references: [kecamatan.id],
  }),
  desa: one(desa, {
    fields: [lokasi.desa_id],
    references: [desa.id],
  }),
}));

export type Lokasi = typeof lokasi.$inferSelect;
