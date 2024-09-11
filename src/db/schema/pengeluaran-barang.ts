import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { pengajuanPestisida } from './pengajuan-pestisida';
import { user } from './user';
import { pestisida } from './pestisida';
import { relations } from 'drizzle-orm';
import { stockAph } from './stock-aph';

export const jenisBarang = pgEnum('jenis_barang', ['pestisida', 'aph']);
export const satuanBarang = pgEnum('satuan_barang', ['liter', 'kg', 'barang']);

export const pengeluaranBarang = pgTable('pengeluaran_barang', {
  id: serial('id').primaryKey(),
  jenis_barang: jenisBarang('jenis_barang'),
  pengajuan_pestisida_id: integer('pengajuan_pestisida_id').references(
    () => pengajuanPestisida.id
  ),
  pengajuan_aph_id: integer('pengajuan_aph_id').default(null),
  bptph_id: integer('bptph_id').references(() => user.id),
  created_at: timestamp('created_at').defaultNow(),
});

export const pengeluaranRelations = relations(
  pengeluaranBarang,
  ({ one, many }) => ({
    pengajuan_pestisida: one(pengajuanPestisida, {
      fields: [pengeluaranBarang.pengajuan_pestisida_id],
      references: [pengajuanPestisida.id],
    }),
    pestisida: many(pestisida),
    bptph: one(user, {
      fields: [pengeluaranBarang.bptph_id],
      references: [user.id],
    }),
    barang: many(barang),
  })
);

export type InsertPengeluaranBarang = typeof pengeluaranBarang.$inferInsert;
export type SelectPengeluaranBarang = typeof pengeluaranBarang.$inferSelect;

export const barang = pgTable('barang', {
  id: serial('id').primaryKey(),
  pengeluaran_id: integer('pengeluaran_id').references(
    () => pengeluaranBarang.id
  ),
  jenis_barang: jenisBarang('jenis_barang'),
  pestisida_id: integer('pestisida_id').references(() => pestisida.id),
  aph_id: integer('aph_id').references(() => stockAph.id),
  satuan: satuanBarang('satuan'),
  volume: integer('volume'),
  keterangan: text('keterangan'),
  created_at: timestamp('created_at').defaultNow(),
});

export const barangRelations = relations(barang, ({ one }) => ({
  pengeluaran_barang: one(pengeluaranBarang, {
    fields: [barang.pengeluaran_id],
    references: [pengeluaranBarang.id],
  }),
}));

export type InsertBarang = typeof barang.$inferInsert;
export type SelectBarang = typeof barang.$inferSelect;
