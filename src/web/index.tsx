import { Hono } from "hono";
import DashboardPage from "./pages/dashboard";

export const web = new Hono();

web.get("/", async (c) => {
  return c.html(<DashboardPage></DashboardPage>);
});
