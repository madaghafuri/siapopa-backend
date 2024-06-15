import { Hono } from "hono";
import { DefaultLayout } from "./layouts/default-layout";

export const web = new Hono();

web.get("/", async (c) => {
  return c.html(<DefaultLayout></DefaultLayout>);
});
