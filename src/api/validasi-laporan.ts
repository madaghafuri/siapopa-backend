import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '..';
import { validasiLaporan } from '../db/schema/validasi-laporan';
import { eq } from 'drizzle-orm';
import { validator } from 'hono/validator';
import { validator as validatorSchema } from '../db/schema/validator';
import { authorizeApi } from '../middleware';

export const validasiLaporanRoute = new Hono<{
  Variables: { session: Session };
}>().basePath('/validasi_laporan');
validasiLaporanRoute.use('*', authorizeApi);

validasiLaporanRoute.put(
  '/:validasiId',
  validator('json', (value, c) => {
    const { user_id, laporan_id, kategori_laporan } = value;
    if (!user_id || !laporan_id || !kategori_laporan) {
      return c.json(
        {
          status: 400,
          message:
            'missing required data user_id, laporan_id, kategori_laporan',
        },
        400
      );
    }
    return value;
  }),
  async (c) => {
    const vlaidasiId = c.req.param('validasiId');
    const {
      user_id,
      usergroup_id,
      laporan_id,
      kategori_laporan,
      sign_user,
      note_user,
    } = c.req.valid('json');

    const laporan =
      kategori_laporan === 'harian'
        ? {
            laporan_harian_id: laporan_id,
          }
        : kategori_laporan === 'sb'
          ? {
              laporan_sb_id: laporan_id,
            }
          : kategori_laporan === 'bulanan'
            ? {
                laporan_bulanan_id: laporan_id,
              }
            : {
                laporan_musiman_id: laporan_id,
              };

    try {
      const updateValidasi = await db
        .update(validasiLaporan)
        .set({ ...laporan })
        .where(eq(validasiLaporan.id, parseInt(vlaidasiId)))
        .returning();

      await db.insert(validatorSchema).values({
        user_id,
        validasi_laporan_id: updateValidasi[0].id,
        validasi_laporan: true,
        note: note_user,
        sign: sign_user,
      });
    } catch (error) {
      console.error(error);
      return c.json(
        {
          status: 500,
          message: 'error updating validasi laporan' + error,
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
