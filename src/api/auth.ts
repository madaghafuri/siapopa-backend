import { Hono } from "hono";
import { validator } from "hono/validator";
import { API_TOKEN, db } from "../index.js";
import { InsertUser, user } from "../db/schema/user.js";
import { and, eq } from "drizzle-orm";
import { JwtVariables } from "hono/jwt";
import bcrypt from "bcrypt";

export const auth = new Hono<{ Variables: JwtVariables }>();

auth.post(
  "login",
  validator("json", (value, c) => {
    const { email, password } = value;
    if (!email || !password) {
      return c.json(
        {
          status: 400,
          message: "email atau password belum diisi",
        },
        400,
      );
    }
    return value;
  }),
  async (c) => {
    const { email, password } = c.req.valid("json") as Record<string, string>;

    const findUser = await db.query.user.findFirst({
      with: {
        lokasis: true,
        userGroup: true,
      },
      where: and(eq(user.email, email)),
    });

    if (!findUser) {
      return c.json(
        {
          status: 404,
          message: "user tidak ditemukan",
        },
        404,
      );
    }

    const comparePass = bcrypt.compareSync(password, findUser.password);

    if (!comparePass) {
      return c.json(
        {
          status: 404,
          message: "user tidak ditemukan",
        },
        404,
      );
    }

    return c.json({
      status: 200,
      message: "login user berhasil",
      data: { ...findUser, token: API_TOKEN },
    });
  },
);

auth.post(
  "register",
  validator("json", (value, c) => {
    const { email, password, name, phone, ...rest } = value as InsertUser;

    if (!email || !password || !name || !phone) {
      return c.json(
        {
          status: 401,
          message: "missing required data. email, password, name, phone",
        },
        401,
      );
    }

    return { email, password, name, phone, ...rest };
  }),
  async (c) => {
    const data = c.req.valid("json");

    const hPass = bcrypt.hashSync(data.password, 10);

    console.log(hPass);

    try {
      await db
        .insert(user)
        .values({ ...data, password: hPass })
        .returning();
    } catch (error) {
      console.error(error);
      return c.json(
        {
          status: 500,
          message: "internal server error" + error,
        },
        500,
      );
    }

    return c.json({
      status: 200,
      message: "success",
    });
  },
);
