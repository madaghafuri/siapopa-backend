import { Hono } from "hono";
import DashboardPage from "./pages/dashboard.js";
import DataLokasiPage from "./pages/data-lokasi.js";
import { Session } from "hono-sessions";
import { db } from "../index.js";
import { eq } from "drizzle-orm";
import { user } from "../db/schema/user.js";
import { DefaultLayout } from "./layouts/default-layout.js";
import Profile, { AuthenticatedUser } from "./components/profile.js";

const web = new Hono<{
  Variables: {
    session: Session;
    session_key_rotation: boolean;
  };
}>();

// Dashboard Related
web.get("/dashboard", async (c) => {
  const session = c.get("session");
  const userId = session.get("user_id") as string;

  const selectedUser = await db.query.user
    .findFirst({
      where: eq(user.id, parseInt(userId)),
      with: {
        userGroup: true,
      },
    })
    .catch((err) => {
      console.error(err);
    });

  return c.html(
    <DefaultLayout
      route="dashboard"
      authNavigation={<Profile user={selectedUser as AuthenticatedUser} />}
    >
      <DashboardPage></DashboardPage>
    </DefaultLayout>,
  );
});

// Data Lokasi Related
web.get("/data-lokasi", async (c) => {
  return c.html(<DataLokasiPage route="data-lokasi"></DataLokasiPage>);
});

export default web;
