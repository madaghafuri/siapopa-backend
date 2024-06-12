import { serve } from "@hono/node-server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import pg from "pg";
import { api } from "./api";
import * as user from "../db/schema/user";
import { logger } from "hono/logger";
import { jwt } from "hono/jwt";
import * as desa from "../db/schema/desa";
import * as detailRumpun from "../db/schema/detail-rumpun";
import * as kabupatenKota from "../db/schema/kabupaten-kota";
import * as kategoriKerusakan from "../db/schema/kategori-kerusakan";
import * as kategoriLaporan from "../db/schema/kategori-laporan";
import * as kategoriSerangan from "../db/schema/kategori-serangan";
import * as kecamatan from "../db/schema/kecamatan";
import * as laporanBulanan from "../db/schema/laporan-bulanan";
import * as laporanHarian from "../db/schema/laporan-harian";
import * as laporanMusiman from "../db/schema/laporan-musiman";
import * as laporanSb from "../db/schema/laporan-sb";
import * as lokasi from "../db/schema/lokasi";
import * as luasKerusakanSb from "../db/schema/luas-kerusakan-sb";
import * as makhlukAsing from "../db/schema/makhluk-asing";
import * as opt from "../db/schema/opt";
import * as pengamatan from "../db/schema/pengamatan";
import * as photoPengamatan from "../db/schema/photo-pengamatan";
import * as provinsi from "../db/schema/provinsi";
import * as rumpun from "../db/schema/rumpun";
import * as tanaman from "../db/schema/tanaman";
import * as userGroup from "../db/schema/user-group";
import * as validasiLaporan from "../db/schema/validasi-laporan";
const { Client } = pg;

const client = new Client({
  connectionString: "postgres://postgres:postgres@db:5432/siapopa-dev",
  ssl: false,
});
await client.connect();
export const db = drizzle(client, {
  schema: {
    ...desa,
    ...detailRumpun,
    ...kabupatenKota,
    ...kategoriKerusakan,
    ...kategoriLaporan,
    ...kategoriSerangan,
    ...kecamatan,
    ...laporanBulanan,
    ...laporanHarian,
    ...laporanMusiman,
    ...laporanSb,
    ...lokasi,
    ...luasKerusakanSb,
    ...makhlukAsing,
    ...opt,
    ...pengamatan,
    ...photoPengamatan,
    ...provinsi,
    ...rumpun,
    ...tanaman,
    ...userGroup,
    ...user,
    ...validasiLaporan,
  },
});

const app = new Hono();

app.use(logger());

app.get("/", async (c) => {
  return c.text("Its a me, Mario!");
});

// app.use(
//   "/api/v1/*",
//   jwt({
//     secret: "very-secret",
//   })
// );

app.route("/api/v1", api);

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
