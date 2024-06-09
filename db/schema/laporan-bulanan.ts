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

export const laporanBulanan = pgTable("laporan_bulanan", {
  id: serial("id").primaryKey(),
  opt_id: integer("opt_id").references(() => opt.id),
  laporan_musiman_id: integer("laporan_musiman_id").references(
    () => laporanMusiman.id
  ),
  tanggal: date("tanggal").defaultNow(),
  point: geometry("point", { type: "point" }),
  periode: integer("periode"),
  note: text("note"),
  status: boolean("status"),
  pic_id: integer("pic_id").references(() => user.id),
  sign_pic: text("sign_pic"),
});
