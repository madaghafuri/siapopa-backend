import {
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { opt } from './opt';
import { tanaman } from './tanaman';
import { lokasi } from './lokasi';
import { golonganPestisida } from './golongan-pestisida';
import { bahanAktif } from './bahan-aktif';

export const satuanPestisida = pgEnum('satuan_pestisida', [
  'kg',
  'liter',
  'batang',
]);

export const pestisida = pgTable('pestisida', {
  id: serial('id').primaryKey(),
  satuan: satuanPestisida('satuan'),
  bahan_aktif_id: integer('bahan_aktif_id').references(() => bahanAktif.id),
  merk_dagang:  text('merk_dagang'),
  opt_id: integer('opt_id').references(() => opt.id),
  tanaman_id: integer('tanaman_id').references(() => tanaman.id),
  volume: integer('volume'),
  expired_date: date('expired_date').defaultNow(),
  periode_bulan: text('periode_bulan'),
  tahun_pengadaan: text('tahun_pengadaan'),
  lokasi_id: text('lokasi_id').references(() => lokasi.id),
  created_at: timestamp('created_at').defaultNow(),
  golongan_pestisida_id: integer('golongan_pestisida_id').references(
    () => golonganPestisida.id
  ),
});

export type InsertPestisida = typeof pestisida.$inferInsert;
export type SelectPestisida = typeof pestisida.$inferSelect;