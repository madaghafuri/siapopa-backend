import { integer, pgEnum, pgTable, serial } from "drizzle-orm/pg-core";
import { rumpun } from "./rumpun.js";
import { opt } from "./opt.js";
import { hama } from "./makhluk-asing.js";

const ListKerusakan = [
  "mutlak",
  "tidak mutlak",
  "ekor/rumpun",
  "ekor/m2",
] as const;

const ObjKerusakan = {
  mutlak: "mutlak",
  "tidak mutlak": "tidak mutlak",
  "ekor/rumpun": "ekor/rumpun",
  "ekor/m2": "ekor/m2",
} as const;

export const kerusakan = pgEnum("kerusakan", ListKerusakan);

export const detailRumpun = pgTable("detail_rumpun", {
  id: serial("id").primaryKey(),
  rumpun_id: integer("rumpun_id").references(() => rumpun.id),
  opt_id: integer("opt_id").references(() => opt.id),
  jumlah_opt: integer("jumlah_opt"),
  skala_kerusakan: kerusakan("skala_kerusakan"),
  hama_id: integer("hama_id").references(() => hama.id),
  jumlah_hama: integer("jumlah_hama"),
});

export type DetailRumpun = typeof detailRumpun.$inferSelect;
export type Kerusakan = keyof typeof ObjKerusakan;
