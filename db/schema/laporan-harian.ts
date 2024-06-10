import {
  boolean,
  date,
  integer,
  pgTable,
  serial,
  text,
} from "drizzle-orm/pg-core";
import { pengamatan } from "./pengamatan";
import { opt } from "./opt";
import { user } from "./user";
import { laporanSb } from "./laporan-sb";

export const laporanHarian = pgTable("laporan_harian", {
  id: serial("id").primaryKey(),
  pengamatan_id: integer("pengamatan_id").references(() => pengamatan.id),
  opt_id: integer("opt_id").references(() => opt.id),
  tanggal_laporan_harian: date("tanggal_laporan_harian").defaultNow(),
  luas_waspada: integer("luas_waspada"),
  rekomendasi_pengendalian: text("rekomendasi_pengendalian"),
  id_laporan_sb: integer("id_laporan_sb").references(() => laporanSb.id),
  pic_id: integer("pic_id").references(() => user.id),
  sign_pic: text("sign_pic"),
  status_laporan_sb: boolean("status_laporan_sb").default(false),
});

export type LaporanHarian = typeof laporanHarian.$inferSelect;
