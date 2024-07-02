import { Hono } from "hono";
import DashboardPage from "./pages/dashboard.js";
import { Session } from "hono-sessions";
import { db } from "../index.js";
import { eq } from "drizzle-orm";
import { user } from "../db/schema/user.js";
import { DefaultLayout } from "./layouts/default-layout.js";
import Profile, { AuthenticatedUser } from "./components/profile.js";
import InputTanaman from "./pages/input/tanaman.js";
import { validator } from "hono/validator";
import { InsertTanaman, tanaman } from "../db/schema/tanaman.js";
import InputOPT from "./pages/input/opt.js";
import { InsertOPT, opt } from "../db/schema/opt.js";
import InputHama from "./pages/input/hama.js";

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
        500,
      );
    }

    return c.html(<span>Berhasil input tanaman</span>);
  },
);
input.get("/opt", async (c) => {
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

  const selectTanaman = await db.select().from(tanaman);

  return c.html(
    <DefaultLayout
      route="input-opt"
      authNavigation={<Profile user={selectedUser as AuthenticatedUser} />}
    >
      <InputOPT listTanaman={selectTanaman} />
    </DefaultLayout>,
  );
});
input.post(
  "/opt",
  validator("form", (value, c) => {
    const { kode_opt, nama_opt, status, tanaman_id } =
      value as unknown as InsertOPT;

    if (!kode_opt || !nama_opt || !status || !tanaman_id) {
      return c.html(<span>Data yang dibutuhkan tidak sesuai</span>);
    }
    return { kode_opt, nama_opt, status, tanaman_id };
  }),
  async (c) => {
    const optData = c.req.valid("form");

    try {
      await db.insert(opt).values({ ...optData });
    } catch (error) {
      console.error(error);
      return c.html(
        <span>
          Terjadi kesalahan dalam proses penginputan data. Silahkan coba lagi
        </span>,
        500,
      );
    }

    return c.html(<span>Berhasil menambahkan data</span>);
  },
);
input.get("/hama", async (c) => {
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

  const selectTanaman = await db.select().from(tanaman);

  return c.html(
    <DefaultLayout
      route="input-hama"
      authNavigation={<Profile user={selectedUser as AuthenticatedUser} />}
    >
      <InputHama listTanaman={selectTanaman} />
    </DefaultLayout>,
  );
});
export default web;
