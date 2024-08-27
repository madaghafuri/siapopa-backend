import {
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { kecamatan } from './kecamatan';
import { kabupatenKota } from './kabupaten-kota';
import { opt } from './opt';
import { user } from './user';
import { bahanAktif } from './bahan-aktif';

export const jenisPengendalian = pgEnum('jenis_pengendalian', [
  'populasi',
  'intensitas serangan',
]);

export const rekomendasiPOPT = pgTable('rekomendasi_popt', {
  id: serial('id').primaryKey(),
  kecamatan_id: text('kecamatan_id').references(() => kecamatan.id),
  kabkot_id: text('kabkot_id').references(() => kabupatenKota.id),
  opt_id: integer('opt_id').references(() => opt.id),
  popt_id: integer('popt_id').references(() => user.id),
  varietas: text('varietas'),
  umur_tanaman: integer('umur_tanaman'),
  jenis_pengendalian: jenisPengendalian('jenis_pengendalian'),
  bahan_aktif_id: integer('bahan_aktif_id').references(() => bahanAktif.id),
  tanggal_rekomendasi_pengedalian: date('tanggal_rekomendasi_pengendalian'),
  ambang_lampau_pengendalian: integer('ambang_lampau_pengendalian'),
  sign_popt: text('sign_popt'),
  created_at: timestamp('created_at').defaultNow(),
});

export type InsertRekomendasiPOPT = typeof rekomendasiPOPT.$inferInsert;
export type SelectRekomendasiPOPT = typeof rekomendasiPOPT.$inferSelect;
