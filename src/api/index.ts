import { Hono } from "hono";
import { auth } from "./auth";
import { rumpun } from "./rumpun";

export const api = new Hono();

api.route("", auth);
api.route("/rumpun", rumpun);
