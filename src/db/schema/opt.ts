// Organisme Penggerek Tanaman

import { integer, pgEnum, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { tanaman } from './tanaman';
import { relations } from 'drizzle-orm';

const statusOpt = ['mutlak', 'tidak mutlak'] as const;
const jenisOpt = ['opt', 'ma'] as const;
export const status_opt = pgEnum('status', statusOpt);
export const jenis_opt = pgEnum('jenis', jenisOpt);

export const opt = pgTable('opt', {
  id: serial('id').primaryKey(),
  nama_opt: text('nama_opt'),
  status: status_opt('status'),
  kode_opt: text('kode_opt').notNull().unique(),
  jenis: jenis_opt('jenis'),
  tanaman_id: integer('tanaman_id').references(() => tanaman.id),
});

export const optRelations = relations(opt, ({ one }) => ({
  tanaman: one(tanaman, {
    fields: [opt.tanaman_id],
    references: [tanaman.id],
  }),
}));

export type SelectOPT = typeof opt.$inferSelect;
export type InsertOPT = typeof opt.$inferInsert;
