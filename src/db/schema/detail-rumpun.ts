import { integer, pgEnum, pgTable, serial } from 'drizzle-orm/pg-core';
import { rumpun } from './rumpun';
import { opt } from './opt';
import { relations } from 'drizzle-orm';

const ListKerusakan = [
  'mutlak',
  'tidak mutlak',
  'ekor/rumpun',
  'ekor/m2',
  'ma',
] as const;

const ObjKerusakan = {
  mutlak: 'mutlak',
  'tidak mutlak': 'tidak mutlak',
  'ekor/rumpun': 'ekor/rumpun',
  'ekor/m2': 'ekor/m2',
  ma: 'ma',
} as const;

export const kerusakan = pgEnum('kerusakan', ListKerusakan);

export const detailRumpun = pgTable('detail_rumpun', {
  id: serial('id').primaryKey(),
  rumpun_id: integer('rumpun_id').references(() => rumpun.id),
  opt_id: integer('opt_id').references(() => opt.id),
  jumlah_opt: integer('jumlah_opt'),
  skala_kerusakan: kerusakan('skala_kerusakan'),
});

export const detailRumpunRelations = relations(detailRumpun, ({ one }) => ({
  rumpun: one(rumpun, {
    fields: [detailRumpun.rumpun_id],
    references: [rumpun.id],
  }),
  opt: one(opt, {
    fields: [detailRumpun.opt_id],
    references: [opt.id],
  }),
}));

export type DetailRumpun = typeof detailRumpun.$inferSelect;
export type Kerusakan = keyof typeof ObjKerusakan;
