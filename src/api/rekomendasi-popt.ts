import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { SelectUser } from '../db/schema/user';
import { SelectUserGroup } from '../db/schema/user-group';
import { Lokasi } from '../db/schema/lokasi';
import { validator } from 'hono/validator';
import {
  InsertRekomendasiPOPT,
  rekomendasiPOPT,
} from '../db/schema/rekomendasi-popt';
import {
  InsertRincianRekomendasiPOPT,
  rincianRekomendasiPOPT,
} from '../db/schema/rincian-rekomendasi-popt';
import { db } from '..';

export const rekomendasiPOPTRoute = new Hono<{
  Variables: {
    session: Session;
    user: Omit<SelectUser, 'password'> & {
      userGroup: SelectUserGroup;
      locations: Lokasi[];
    };
  };
}>().basePath('/rekomendasi-popt');

rekomendasiPOPTRoute.post(
  '/',
  validator('json', (value, c) => {
    const { opt_id, popt_id, rincian_rekomendasi } =
      value as InsertRekomendasiPOPT & {
        rincian_rekomendasi: InsertRincianRekomendasiPOPT[];
      };
    if (
      !opt_id ||
      !popt_id ||
      !rincian_rekomendasi ||
      rincian_rekomendasi.length === 0
    ) {
      return c.json(
        {
          status: 401,
          message: 'missing required data',
        },
        401
      );
    }

    return value as InsertRekomendasiPOPT & {
      rincian_rekomendasi: InsertRincianRekomendasiPOPT[];
    };
  }),
  async (c) => {
    const { rincian_rekomendasi, ...data } = c.req.valid('json');

    try {
      var insertRekomendasi = await db
        .insert(rekomendasiPOPT)
        .values({ ...data })
        .returning();
    } catch (error) {
      console.error(error);
      return c.json(
        {
          status: 500,
          message: 'internal server error ' + error,
        },
        500
      );
    }

    const mappedRincian = rincian_rekomendasi.map((val) => ({
      ...val,
      rekomendasi_popt_id: insertRekomendasi[0].id,
    }));

    try {
      await db.insert(rincianRekomendasiPOPT).values(mappedRincian);
    } catch (error) {
      console.error(error);
      return c.json(
        {
          status: 500,
          message: 'internal server error ' + error,
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
