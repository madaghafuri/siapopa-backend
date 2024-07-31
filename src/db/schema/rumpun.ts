import { integer, pgTable, serial } from 'drizzle-orm/pg-core';
import { pengamatan } from './pengamatan';
import { relations } from 'drizzle-orm';
import { detailRumpun } from './detail-rumpun';

export const rumpun = pgTable('rumpun', {
  id: serial('id').primaryKey(),
  pengamatan_id: integer('pengamatan_id').references(() => pengamatan.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  rumpun_ke: integer('rumpun_ke'),
  jumlah_anakan: integer('jumlah_anakan'),
  luas_spot_hopperburn: integer('luas_spot_hopperburn'),
});

export const rumpunRelations = relations(rumpun, ({ one, many }) => ({
  pengamatan: one(pengamatan, {
    fields: [rumpun.pengamatan_id],
    references: [pengamatan.id],
  }),
  detailRumpun: many(detailRumpun),
}));

export type InsertRumpun = typeof rumpun.$inferInsert;
export type SelectRumpun = typeof rumpun.$inferSelect;
