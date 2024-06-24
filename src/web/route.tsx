import { Hono } from "hono";
import DashboardPage from "./pages/dashboard.js";
import DataLokasiPage from "./pages/data-lokasi.js";
import { Session } from "hono-sessions";

const web = new Hono<{
  Variables: {
    session: Session;
    session_key_rotation: boolean;
  };
}>();

// Dashboard Related
web.get("/dashboard", async (c) => {
  console.log(c.get("session"));

  return c.html(<DashboardPage route="dashboard"></DashboardPage>);
});

// Data Lokasi Related
web.get("/data-lokasi", async (c) => {
  return c.html(<DataLokasiPage route="data-lokasi"></DataLokasiPage>);
});

export default web;
