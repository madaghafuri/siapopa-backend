import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { SelectUser } from '../db/schema/user';
import { SelectUserGroup } from '../db/schema/user-group';
import { Lokasi } from '../db/schema/lokasi';
import { validator } from 'hono/validator';
import { db } from '..';
import {
  InsertPengajuanPestisida,
  pengajuanPestisida,
} from '../db/schema/pengajuan-pestisida';
import {
  InsertRincianPengajuan,
  rincianPengajuanPestisida,
} from '../db/schema/rincian-pengajuan-pestisida';

export const pengajuanPestisidaRoute = new Hono<{
  Variables: {
    session: Session;
    user: Omit<SelectUser, 'password'> & {
      userGroup: SelectUserGroup;
      locations: Lokasi[];
    };
  };
}>().basePath('pengajuan-pestisida');

pengajuanPestisidaRoute.post(
  '/',
  validator('json', (value, c) => {
    return value;
  }),
  async (c) => {
    const { rincian_pengajuan, ...data } = c.req.valid(
      'json'
    ) as InsertPengajuanPestisida & {
      rincian_pengajuan: InsertRincianPengajuan[];
    };

    try {
      var insertData = await db
        .insert(pengajuanPestisida)
        .values({ ...data })
        .returning();
    } catch (error) {
      return c.json(
        {
          status: 500,
          message: 'internal server error ' + error,
        },
        500
      );
    }

    const mappedRincian = rincian_pengajuan.map((val) => ({
      ...val,
      pengajuan_pestisida_id: insertData[0].id,
    }));

    try {
      await db.insert(rincianPengajuanPestisida).values(mappedRincian);
    } catch (error) {
      console.error(
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
