import {
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

export const satuanPestisida = pgEnum('satuan_pestisida', [
  'kg',
  'liter',
  'batang',
]);

export const pestisida = pgTable('pestisida', {
  id: serial('id').primaryKey(),
  satuan: satuanPestisida('satuan'),
  opt_id: integer('opt_id').references(() => opt.id),
  tanaman_id: integer('tanaman_id').references(() => tanaman.id),
  volume: integer('volume'),
  lokasi_id: text('lokasi_id').references(() => lokasi.id),
  created_at: timestamp('created_at').defaultNow(),
  golongan_pestisida_id: integer('golongan_pestisida_id').references(
    () => golonganPestisida.id
  ),
});
