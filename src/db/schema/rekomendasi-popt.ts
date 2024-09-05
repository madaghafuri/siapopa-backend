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
import { pengamatan } from './pengamatan';
import { relations } from 'drizzle-orm';
import { rincianRekomendasiPOPT } from './rincian-rekomendasi-popt';
import { pengajuanPestisida } from './pengajuan-pestisida';

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
  pengamatan_id: integer('pengamatan_id').references(() => pengamatan.id),
  pengajuan_pestisida_id: integer('pengajuan_pestisida_id').references(
    () => pengajuanPestisida.id
  ),
  tanggal_rekomendasi_pengendalian: date('tanggal_rekomendasi_pengendalian'),
  ambang_lampau_pengendalian: integer('ambang_lampau_pengendalian'),
  sign_popt: text('sign_popt'),
  surat_rekomendasi_popt: text('surat_rekomendasi_popt'),
  created_at: timestamp('created_at').defaultNow(),
});

export const rekomendasiPoptRelations = relations(
  rekomendasiPOPT,
  ({ one, many }) => ({
    kecamatan: one(kecamatan, {
      fields: [rekomendasiPOPT.kecamatan_id],
      references: [kecamatan.id],
    }),
    kabupaten_kota: one(kabupatenKota, {
      fields: [rekomendasiPOPT.kabkot_id],
      references: [kabupatenKota.id],
    }),
    opt: one(opt, {
      fields: [rekomendasiPOPT.opt_id],
      references: [opt.id],
    }),
    popt: one(user, {
      fields: [rekomendasiPOPT.popt_id],
      references: [user.id],
    }),
    bahan_aktif: one(bahanAktif, {
      fields: [rekomendasiPOPT.bahan_aktif_id],
      references: [bahanAktif.id],
    }),
    pengamatan: one(pengamatan, {
      fields: [rekomendasiPOPT.pengamatan_id],
      references: [pengamatan.id],
    }),
    rincian_rekomendasi: many(rincianRekomendasiPOPT),
    pengajuan_pestisida: one(pengajuanPestisida, {
      fields: [rekomendasiPOPT.pengajuan_pestisida_id],
      references: [pengajuanPestisida.id],
    }),
  })
);

export type InsertRekomendasiPOPT = typeof rekomendasiPOPT.$inferInsert;
export type SelectRekomendasiPOPT = typeof rekomendasiPOPT.$inferSelect;
