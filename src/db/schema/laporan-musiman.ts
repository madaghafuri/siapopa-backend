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
import { relations } from "drizzle-orm";
import { laporanBulanan } from "./laporan-bulanan";

export const laporanMusiman = pgTable("laporan_musiman", {
  id: serial("id").primaryKey(),
  opt_id: integer("opt_id").references(() => opt.id),
  tanggal: date("tanggal").defaultNow(),
  point: geometry("point", { type: "point" }),
  periode: integer("periode"),
  note: text("note"),
  pic_id: integer("pic_id").references(() => user.id),
  sign_pic: text("sign_pic"),
  start_date: date("start_date"),
  end_date: date("end_date"),
});

export const laporanMusimanRelations = relations(
  laporanMusiman,
  ({ many }) => ({
    laporanBulanan: many(laporanBulanan),
  }),
);

export type LaporanMusiman = typeof laporanMusiman.$inferSelect;
export type InsertLaporanMusiman = typeof laporanMusiman.$inferInsert;
