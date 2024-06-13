import { Hono } from "hono";
import { auth } from "./auth";
import { rumpun } from "./rumpun";
import { detailRumpun } from "./detail-rumpun";
import { pengamatan } from "./pengamatan";
import { laporanHarian } from "./laporan-harian";
import { laporanSb } from "./laporan-sb";

export const api = new Hono();

api.route("", auth);
api.route("", rumpun);
api.route("", detailRumpun);
api.route("", pengamatan);
api.route("", laporanHarian);
api.route("", laporanSb);
