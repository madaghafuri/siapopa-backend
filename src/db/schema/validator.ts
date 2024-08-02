import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { validasiLaporan } from './validasi-laporan';
import { user } from './user';
import { relations } from 'drizzle-orm';

export const validator = pgTable('validator', {
  id: serial('id').primaryKey().notNull(),
  validasi_laporan_id: integer('validasi_laporan_id').references(
    () => validasiLaporan.id,
    { onDelete: 'cascade', onUpdate: 'cascade' }
  ),
  user_id: integer('user_id').references(() => user.id),
  sign: text('sign'),
  note: text('note'),
  validasi_laporan: boolean('validasi_laporan').default(false),
  created_at: timestamp('created_at').defaultNow(),
});

export const validatorRelations = relations(validator, ({ one }) => ({
  user: one(user, {
    fields: [validator.user_id],
    references: [user.id],
  }),
  validasi_laporan: one(validasiLaporan, {
    fields: [validator.validasi_laporan_id],
    references: [validasiLaporan.id],
  }),
}));

export type SelectValidator = typeof validator.$inferSelect;
