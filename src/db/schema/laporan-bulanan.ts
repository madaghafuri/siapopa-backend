import {
  boolean,
  date,
  geometry,
  integer,
  pgTable,
  serial,
  text,
} from "drizzle-orm/pg-core";
import { opt } from "./opt";
import { user } from "./user";
import { laporanMusiman } from "./laporan-musiman";
import { relations } from "drizzle-orm";
import { laporanSb } from "./laporan-sb";

export const laporanBulanan = pgTable("laporan_bulanan", {
  id: serial("id").primaryKey(),
  opt_id: integer("opt_id").references(() => opt.id),
  laporan_musiman_id: integer("laporan_musiman_id").references(
    () => laporanMusiman.id,
  ),
  tanggal_laporan_bulanan: date("tanggal_laporan_bulanan").defaultNow(),
  point: geometry("point", { type: "point" }),
  periode_laporan_bulanan: integer("periode_laporan_bulanan"),
  note: text("note"),
  pic_id: integer("pic_id").references(() => user.id),
  sign_pic: text("sign_pic"),
  status_laporan_musiman: boolean("status_laporan_musiman").default(false),
  start_date: date("start_date"),
  end_date: date("end_date"),
});

export const laporanBulananRelations = relations(
  laporanBulanan,
  ({ many, one }) => ({
    laporanSb: many(laporanSb),
    laporanMusiman: one(laporanMusiman, {
      fields: [laporanBulanan.laporan_musiman_id],
      references: [laporanMusiman.id],
    }),
  }),
);

export type LaporanBulanan = typeof laporanBulanan.$inferSelect;
export type InsertLaporanBulanan = typeof laporanBulanan.$inferInsert;
