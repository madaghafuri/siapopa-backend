import { Hono } from "hono";
import DashboardPage from "./pages/dashboard.js";

const web = new Hono();

web.get("/", async (c) => {
  return c.html(<DashboardPage></DashboardPage>);
});

export default web;
