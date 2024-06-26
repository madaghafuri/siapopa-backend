import { Hono } from "hono";
import DashboardPage from "./pages/dashboard.js";
import DataLokasiPage from "./pages/data-lokasi.js";
import { Session } from "hono-sessions";
import { db } from "../index.js";
import { eq } from "drizzle-orm";
import { user } from "../db/schema/user.js";
import { DefaultLayout } from "./layouts/default-layout.js";
import Profile, { AuthenticatedUser } from "./components/profile.js";
import InputTanaman from "./pages/input/tanaman.js";
import { validator } from "hono/validator";
import { InsertTanaman, tanaman } from "../db/schema/tanaman.js";

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

const input = web.route("/input");
input.get("/tanaman", async (c) => {
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
      route="input-tanaman"
      authNavigation={<Profile user={selectedUser as AuthenticatedUser} />}
    >
      <InputTanaman />
    </DefaultLayout>,
  );
});
input.post(
  "/tanaman",
  validator("form", (value, c) => {
    const { nama_tanaman } = value as unknown as InsertTanaman;

    if (!nama_tanaman) {
      return c.html(
        <span class="text-sm text-red-500">nama tanaman belum diinput</span>,
      );
    }

    return nama_tanaman;
  }),
  async (c) => {
    const namaTanaman = c.req.valid("form");

    try {
      await db.insert(tanaman).values({ nama_tanaman: namaTanaman });
    } catch (error) {
      console.error(error);
      return c.html(
        <span>Terjadi kesalahan dalam input data. Silahkan coba lagi</span>,
      );
    }

    return c.html(<span>Berhasil input tanaman</span>);
  },
);

web.get("/input-data", async (c) => {
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
      route="input-data"
      authNavigation={<Profile user={selectedUser as AuthenticatedUser} />}
    ></DefaultLayout>,
  );
});

// Data Lokasi Related
web.get("/data-lokasi", async (c) => {
  return c.html(<DataLokasiPage route="data-lokasi"></DataLokasiPage>);
});

export default web;
