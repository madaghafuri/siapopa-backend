import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const bahanAktif = pgTable('bahan_aktif', {
  id: serial('id').primaryKey(),
  nama_bahan: text('nama_bahan'),
  created_at: timestamp('created_at').defaultNow(),
});

export type SelectBahanAktif = typeof bahanAktif.$inferSelect;
export type InsertBahanAktif = typeof bahanAktif.$inferInsert;