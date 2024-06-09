import { integer, pgEnum, pgTable, serial } from "drizzle-orm/pg-core";
import { rumpun } from "./rumpun";
import { opt } from "./opt";
import { makhlukAsing } from "./makhluk-asing";

export const kerusakan = pgEnum("kerusakan", [
  "mutlak",
  "tidak mutlak",
  "ekor/rumpun",
  "ekor/m2",
]);

export const detailRumpun = pgTable("detail_rumpun", {
  id: serial("id").primaryKey(),
  rumpun_id: integer("rumpun_id").references(() => rumpun.id),
  opt_id: integer("opt_id").references(() => opt.id),
  jumlah_opt: integer("jumlah_opt"),
  skala_kerusakan: kerusakan("skala_kerusakan"),
  hama_id: integer("hama_id").references(() => makhlukAsing.id),
  jumlah_hama: integer("jumlah_hama"),
});
