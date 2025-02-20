import {
  boolean,
  date,
  decimal,
  geometry,
  integer,
  pgTable,
  real,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { tanaman } from './tanaman';
import { lokasi } from './lokasi';
import { user } from './user';
import { relations } from 'drizzle-orm';
import { laporanHarian } from './laporan-harian';
import { rumpun } from './rumpun';
import { photoPengamatan } from './photo-pengamatan';

export const pengamatan = pgTable('pengamatan', {
  id: serial('id').primaryKey(),
  tanaman_id: integer('tanaman_id').references(() => tanaman.id),
  lokasi_id: text('lokasi_id').references(() => lokasi.id),
  hari_ke: integer('hari_ke').notNull(),
  blok: text('blok'),
  luas_hamparan: integer('luas_hamparan'),
  luas_diamati: integer('luas_diamati'),
  luas_hasil_panen: integer('luas_hasil_panen'),
  luas_persemaian: integer('luas_persemaian'),
  ph_tanah: decimal('ph_tanah'),
  komoditas: text('komoditas'),
  varietas: text('varietas'),
  dari_umur: integer('dari_umur'),
  hingga_umur: integer('hingga_umur'),
  pola_tanam: text('pola_tanam'),
  pic_id: integer('pic_id').references(() => user.id),
  sign_pic: text('sign_pic'), // path ke foto tanda tangan
  tanggal_pengamatan: date('tanggal_pengamatan').defaultNow(),
  point_pengamatan: geometry('point_pengamatan', { type: 'point' }),
  status_laporan_harian: boolean('status_laporan_harian').default(false),
  luas_spot_hopperburn: real('luas_spot_hopperburn'),
});

export const pengamatanRelations = relations(pengamatan, ({ one, many }) => ({
  laporanHarian: one(laporanHarian),
  rumpun: many(rumpun),
  locations: one(lokasi, {
    fields: [pengamatan.lokasi_id],
    references: [lokasi.id],
  }),
  tanaman: one(tanaman, {
    fields: [pengamatan.tanaman_id],
    references: [tanaman.id],
  }),
  pic: one(user, {
    fields: [pengamatan.pic_id],
    references: [user.id],
  }),
  bukti_pengamatan: many(photoPengamatan),
}));

export type Pengamatan = typeof pengamatan.$inferSelect;
