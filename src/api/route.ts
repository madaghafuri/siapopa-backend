import { Hono } from "hono";
import { auth } from "./auth.js";
import { rumpun } from "./rumpun.js";
import { detailRumpun } from "./detail-rumpun.js";
import { pengamatan } from "./pengamatan.js";
import { laporanHarian } from "./laporan-harian.js";
import { laporanSb } from "./laporan-sb.js";
import { laporanBulanan } from "./laporan-bulanan.js";
import { laporanMusiman } from "./laporan-musiman.js";
import { tanaman } from "./tanaman.js";
import { opt } from "./opt.js";

const api = new Hono();

api.route("", auth);
api.route("", rumpun);
api.route("", detailRumpun);
api.route("", pengamatan);
api.route("", laporanHarian);
api.route("", laporanSb);
api.route("", laporanBulanan);
api.route("", laporanMusiman);
api.route("", tanaman);
api.route("", opt);

export default api;
