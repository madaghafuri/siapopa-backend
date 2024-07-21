import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const golonganPestisida = pgTable('golongan_pestisida', {
  id: serial('id').primaryKey(),
  nama_golongan: text('nama_golongan'),
  created_at: timestamp('created_at').defaultNow(),
});
