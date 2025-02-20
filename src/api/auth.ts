import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { db, lucia } from '../index';
import { InsertUser, user } from '../db/schema/user';
import { and, eq } from 'drizzle-orm';
import { JwtVariables } from 'hono/jwt';
import { lokasi } from '../db/schema/lokasi';
import { userGroup } from '../db/schema/user-group';
import { getRelatedLocationsByUser } from '../helper';

export const auth = new Hono<{ Variables: JwtVariables }>();

auth.post(
  'login',
  validator('json', (value, c) => {
    const { email, password } = value;
    if (!email || !password) {
      return c.json(
        {
          status: 400,
          message: 'email atau password belum diisi',
        },
        400
      );
    }
    return value;
  }),
  async (c) => {
    const { email, password } = c.req.valid('json') as Record<string, string>;

    const findUser = await db.query.user.findFirst({
      with: {
        userGroup: true,
      },
      where: and(eq(user.email, email)),
    });

    if (!findUser) {
      return c.json(
        {
          status: 404,
          message: 'user tidak ditemukan',
        },
        404
      );
    }

    // const comparePass = bcrypt.compareSync(password, findUser.password);
    const comparePass = await Bun.password.verify(password, findUser.password);

    if (!comparePass) {
      return c.json(
        {
          status: 404,
          message: 'user tidak ditemukan',
        },
        404
      );
    }

    const assignedLocations = await getRelatedLocationsByUser(findUser);

    const locations =
      findUser.userGroup.group_name === 'satpel'
        ? await db.query.lokasi.findMany({
            with: {
              provinsi: {
                columns: {
                  point_provinsi: false,
                  area_provinsi: false,
                },
              },
              kabupaten_kota: {
                columns: {
                  point_kabkot: false,
                  area_kabkot: false,
                },
              },
              kecamatan: {
                columns: {
                  point_kecamatan: false,
                  area_kecamatan: false,
                },
              },
              desa: {
                columns: {
                  point_desa: false,
                  area_desa: false,
                },
              },
            },
            where: (lokasi, { eq }) => eq(lokasi.satpel_id, findUser.id),
          })
        : findUser.userGroup.group_name === 'kortikab'
          ? await db.query.lokasi.findMany({
              with: {
                provinsi: {
                  columns: {
                    point_provinsi: false,
                    area_provinsi: false,
                  },
                },
                kabupaten_kota: {
                  columns: {
                    point_kabkot: false,
                    area_kabkot: false,
                  },
                },
                kecamatan: {
                  columns: {
                    point_kecamatan: false,
                    area_kecamatan: false,
                  },
                },
                desa: {
                  columns: {
                    point_desa: false,
                    area_desa: false,
                  },
                },
              },
              where: (lokasi, { eq }) => eq(lokasi.kortikab_id, findUser.id),
            })
          : findUser.userGroup.group_name === 'bptph'
            ? await db.query.lokasi.findMany({
                with: {
                  provinsi: {
                    columns: {
                      point_provinsi: false,
                      area_provinsi: false,
                    },
                  },
                  kabupaten_kota: {
                    columns: {
                      point_kabkot: false,
                      area_kabkot: false,
                    },
                  },
                  kecamatan: {
                    columns: {
                      point_kecamatan: false,
                      area_kecamatan: false,
                    },
                  },
                  desa: {
                    columns: {
                      point_desa: false,
                      area_desa: false,
                    },
                  },
                },
                where: (lokasi, { eq }) => eq(lokasi.bptph_id, findUser.id),
              })
            : findUser.userGroup.group_name === 'brigade'
              ? await db.query.lokasi.findMany({
                  with: {
                    provinsi: {
                      columns: {
                        point_provinsi: false,
                        area_provinsi: false,
                      },
                    },
                    kabupaten_kota: {
                      columns: {
                        point_kabkot: false,
                        area_kabkot: false,
                      },
                    },
                    kecamatan: {
                      columns: {
                        point_kecamatan: false,
                        area_kecamatan: false,
                      },
                    },
                    desa: {
                      columns: {
                        point_desa: false,
                        area_desa: false,
                      },
                    },
                  },
                  where: (lokasi, { eq }) => eq(lokasi.brigade_id, findUser.id),
                })
              : await db.query.lokasi.findMany({
                  with: {
                    provinsi: {
                      columns: {
                        point_provinsi: false,
                        area_provinsi: false,
                      },
                    },
                    kabupaten_kota: {
                      columns: {
                        point_kabkot: false,
                        area_kabkot: false,
                      },
                    },
                    kecamatan: {
                      columns: {
                        point_kecamatan: false,
                        area_kecamatan: false,
                      },
                    },
                    desa: {
                      columns: {
                        point_desa: false,
                        area_desa: false,
                      },
                    },
                  },
                  where: (lokasi, { eq }) => eq(lokasi.pic_id, findUser.id),
                });

    const session = await lucia.createSession(findUser.id, {});
    const tokenSession = {
      bearerToken: session.id,
      user_id: session.userId,
      fresh: session.fresh,
      expiresAt: session.expiresAt,
    };

    return c.json({
      status: 200,
      message: 'login user berhasil',
      data: {
        id: findUser.id,
        name: findUser.name,
        email: findUser.email,
        phone: findUser.phone,
        photo: findUser.photo,
        validasi: findUser.validasi,
        token: tokenSession,
        usergroup_id: findUser.usergroup_id,
        user_group: findUser.userGroup,
        locations: locations,
      },
    });
  }
);

auth.post(
  'register',
  validator('json', (value, c) => {
    const { email, password, name, phone, ...rest } = value as InsertUser;

    if (!email || !password || !name || !phone) {
      return c.json(
        {
          status: 401,
          message: 'missing required data. email, password, name, phone',
        },
        401
      );
    }

    return { email, password, name, phone, ...rest };
  }),
  async (c) => {
    const data = c.req.valid('json');

    const hPass = await Bun.password.hash(data.password, {
      algorithm: 'bcrypt',
      cost: 10,
    });

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
          message: 'internal server error' + error,
        },
        500
      );
    }

    return c.json({
      status: 200,
      message: 'success',
    });
  }
);
auth.post('logout', async (c) => {
  const auth = c.req.header('Authorization');
  const sessionId = lucia.readBearerToken(auth ?? '');

  if (!sessionId)
    return c.json(
      {
        status: 401,
        message: 'Bearer token missing from request header',
      },
      401
    );

  await lucia.invalidateSession(sessionId);

  return c.json({
    status: 200,
    message: 'success',
  });
});
