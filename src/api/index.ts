import { Hono } from "hono";
import { auth } from "./auth";
import { rumpun } from "./rumpun";
import { detailRumpun } from "./detail-rumpun";
import { pengamatan } from "./pengamatan";

export const api = new Hono();

api.route("", auth);
api.route("", rumpun);
api.route("", detailRumpun);
api.route("", pengamatan);
