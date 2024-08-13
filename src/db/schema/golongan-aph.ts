import { pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const jenisAPH = pgEnum('jenis_aph', [
  'aph',
  'pupuk hayati',
  'pesnab',
  'refugia',
]);

export const golonganAph = pgTable('golongan_aph', {
  id: serial('id').primaryKey(),
  nama_aph: text('nama_aph'),
  jenis: jenisAPH('jenis'),
  created_at: timestamp('created_at').defaultNow(),
});

export type SelectGolonganAph = typeof golonganAph.$inferSelect;
export type InsertGolonganAph = typeof golonganAph.$inferInsert;
