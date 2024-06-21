import { Hono } from "hono";
import DashboardPage from "./pages/dashboard.js";
import DataLokasiPage from "./pages/data-lokasi.js";

const web = new Hono();

// Dashboard Related
web.get("/dashboard", async (c) => {
  return c.html(<DashboardPage route="dashboard"></DashboardPage>);
});

// Data Lokasi Related
web.get("/data-lokasi", async (c) => {
  return c.html(<DataLokasiPage route="data-lokasi"></DataLokasiPage>);
});

export default web;
