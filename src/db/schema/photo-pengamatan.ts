import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { pengamatan } from './pengamatan.js';
import { relations } from 'drizzle-orm';

export const photoPengamatan = pgTable('photo_pengamatan', {
  id: serial('id').primaryKey(),
  path: text('path'),
  pengamatan_id: integer('pengamatan_id').references(() => pengamatan.id),
});

export const photoPengamatanRelations = relations(
  photoPengamatan,
  ({ one }) => ({
    pengamatan: one(pengamatan, {
      fields: [photoPengamatan.pengamatan_id],
      references: [pengamatan.id],
    }),
  })
);

export type PhotoPengamatan = typeof photoPengamatan.$inferSelect;
