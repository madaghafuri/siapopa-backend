import { Hono } from "hono";
import { Session } from "hono-sessions";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import { validator } from "hono/validator";
import { InsertUser, user } from "../db/schema/user.js";
import { db } from "..";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export const auth = new Hono<{
  Variables: {
    session: Session;
    session_rotation_key: boolean;
  };
}>();

auth.get("/login", async (c) => {
  return c.html(<LoginPage />);
});
auth.post(
  "/login",
  validator("form", (value, c) => {
    const { email, password } = value as Record<
      keyof InsertUser,
      InsertUser[keyof InsertUser]
    >;

    if (!email || !password) {
      return c.html(
        <span class="text-sm text-red-500">
          No records matching credentials
        </span>,
      );
    }
    return { email, password };
  }),
  async (c) => {
    const session = c.get("session");
    const { email, password } = c.req.valid("form");

    console.log(session);

    let hashedPass = "";
    bcrypt.hash(password as string, 10, function (err, hash) {
      console.error(err);
      hashedPass = hash;
    });

    try {
      var selectUser = await db.query.user.findFirst({
        where: and(
          eq(user.email, email as string),
          eq(user.password, hashedPass),
        ),
      });
    } catch (error) {
      console.error(error);
    }

    if (!selectUser) {
      return c.html(
        <span class="text-sm text-red-500">
          email atau password yang dimasukkan salah
        </span>,
      );
    }

    session.set("user_id", selectUser.id);
    return c.text("success", 200, {
      "HX-Redirect": "/app/dashboard",
    });
  },
);

auth.post("/logout", async (c) => {
  const session = c.get("session");
  session.deleteSession();
  return c.text("success", 200, {
    "HX-Redirect": "/login",
  });
});

auth.get("/register", async (c) => {
  return c.html(<RegisterPage />);
});
