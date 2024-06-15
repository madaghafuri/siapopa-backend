import { Hono } from "hono";
import { validator } from "hono/validator";
import { db } from "..";
import { user } from "../db/schema/user";
import { and, eq } from "drizzle-orm";
import { JwtVariables, sign } from "hono/jwt";
import { userGroup } from "../db/schema/user-group";
import { lokasi } from "../db/schema/lokasi";

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
      where: and(eq(user.email, email), eq(user.password, password)),
    });

    if (!findUser) {
      return c.json(
        {
          status: 404,
          message: "email atau password tidak ditemukan",
        },
        404,
      );
    }

    const findUserGroup = await db.query.userGroup.findFirst({
      where: eq(userGroup.id, findUser.id),
    });

    const getLocation = await db
      .select()
      .from(lokasi)
      .where(eq(lokasi.pic_id, findUser.id));

    const token = await sign(c.req.valid("form"), findUser.id.toString());

    return c.json({
      status: 200,
      message: "login user berhasil",
      data: {
        user_id: findUser.id,
        phone: findUser.phone,
        name: findUser.name,
        photo: findUser.photo,
        user_group: findUserGroup?.group_name || "",
        token: token,
        location: getLocation,
      },
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
