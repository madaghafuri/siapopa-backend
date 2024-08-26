import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { pengajuanPestisida } from './pengajuan-pestisida';
import { desa } from './desa';
import { lokasi } from './lokasi';

export const rincianPengajuanPestisida = pgTable(
  'rincian_pengajuan_pestisida',
  {
    id: serial('id').primaryKey(),
    pengajuan_pestisida_id: integer('pengajuan_pestisida_id').references(
      () => pengajuanPestisida.id
    ),
    desa_id: text('desa_id').references(() => desa.id),
    lokasi_id: text('lokasi_id').references(() => lokasi.id),
    luas_serangan: integer('luas_serangan'),
    keterangan: text('keterangan'),
    created_at: timestamp('created_at').defaultNow(),
  }
);

export type InsertRincianPengajuan =
  typeof rincianPengajuanPestisida.$inferInsert;
export type SelectRincianPengajuan =
  typeof rincianPengajuanPestisida.$inferSelect;
