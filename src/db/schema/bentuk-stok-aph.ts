import { pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const satuanStockAph = pgEnum('satuan_stock_aph', [
  'btl',
  'cawan',
  'tube',
  'petri',
  'kg',
  'gr',
  'lt',
  'btg',
]);

export const bentukStockAph = pgTable('bentuk_stock_aph', {
  id: serial('id').primaryKey(),
  bentuk: text('bentuk'),
  satuan: satuanStockAph('satuan'),
  created_at: timestamp('created_at'),
});

export type SelectBentukAph = typeof bentukStockAph.$inferSelect;
export type InsertBentukAph = typeof bentukStockAph.$inferInsert;
