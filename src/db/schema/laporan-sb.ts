import {
  boolean,
  date,
  geometry,
  integer,
  pgTable,
  serial,
  text,
} from "drizzle-orm/pg-core";
import { opt } from "./opt.js";
import { user } from "./user.js";
import { laporanBulanan } from "./laporan-bulanan.js";
import { relations } from "drizzle-orm";
import { laporanHarian } from "./laporan-harian.js";
import { luasKerusakanSb } from "./luas-kerusakan-sb.js";

export const laporanSb = pgTable("laporan_sb", {
  id: serial("id").primaryKey(),
  opt_id: integer("opt_id").references(() => opt.id),
  laporan_bulanan_id: integer("laporan_bulanan_id").references(
    () => laporanBulanan.id,
  ),
  tanggal_laporan_sb: date("tanggal_laporan_sb").defaultNow(),
  point_laporan_sb: geometry("point_laporan_sb", { type: "point" }),
  periode_laporan_sb: integer("periode_laporan_sb"),
  luas_sembuh: integer("luas_sembuh"),
  luas_panen: integer("luas_panen"),
  freq_pengendalian: integer("freq_pengendalian"),
  freq_nabati: integer("freq_nabati"),
  note: text("note"),
  pic_id: integer("pic_id").references(() => user.id),
  sign_pic: text("sign_pic"),
  status_laporan_bulanan: boolean("status_laporan_bulanan").default(false),
  start_date: date("start_date"),
  end_date: date("end_date"),
});

export const laporanSbRelations = relations(laporanSb, ({ many, one }) => ({
  laporanHarian: many(laporanHarian),
  laporanBulanan: one(laporanBulanan, {
    fields: [laporanSb.laporan_bulanan_id],
    references: [laporanBulanan.id],
  }),
  luas_kerusakan_sb: many(luasKerusakanSb)
}));

export type LaporanSb = typeof laporanSb.$inferSelect;
export type InsertLaporanSb = typeof laporanSb.$inferInsert;
