import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { provinsi } from "./provinsi.js";
import { kabupatenKota } from "./kabupaten-kota.js";
import { kecamatan } from "./kecamatan.js";
import { desa } from "./desa.js";
import { user } from "./user.js";
import { relations } from "drizzle-orm";

export const lokasi = pgTable("lokasi", {
  id: text("id").primaryKey(),
  alamat: text("alamat"),
  kode_post: text("kode_post"),
  provinsi_id: text("provinsi_id").references(() => provinsi.id),
  kabkot_id: text("kabkot_id").references(() => kabupatenKota.id),
  kecamatan_id: text("kecamatan_id").references(() => kecamatan.id),
  desa_id: text("desa_id").references(() => desa.id),
  pic_id: integer("pic_id").references(() => user.id),
});

export const lokasiRelations = relations(lokasi, ({ one }) => ({
  user: one(user, {
    fields: [lokasi.pic_id],
    references: [user.id],
  }),
}));

export type Lokasi = typeof lokasi.$inferSelect;
