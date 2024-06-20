import { Hono } from "hono";
import { validator } from "hono/validator";
import { API_TOKEN, db } from "../index.js";
import { user } from "../db/schema/user.js";
import { and, eq } from "drizzle-orm";
import { JwtVariables } from "hono/jwt";

export const auth = new Hono<{ Variables: JwtVariables }>();

auth.post(
  "login",
  validator("form", (value, c) => {
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
    const { email, password } = c.req.valid("form") as Record<string, string>;

    const findUser = await db.query.user.findFirst({
      with: {
        lokasis: true,
        userGroup: true,
      },
      where: and(eq(user.email, email), eq(user.password, password)),
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

    return c.json({
      status: 200,
      message: "login user berhasil",
      data: { ...findUser, token: API_TOKEN },
    });
  },
);

// auth.post(
//   "register",
//   validator("form", (value, c) => {
//     const { email, phone, name, password, photo, usergroup_id } = value;

//     if (!email) {
//       return c.json(
//         {
//           status: 400,
//           message:
//             "Tidak dapat melanjutkan permintaan. Kolom email belum diisi",
//         },
//         400
//       );
//     } else if (!phone) {
//     }
//   })
// );
