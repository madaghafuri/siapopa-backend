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
import { rekomendasiPOPT } from '../db/schema/rekomendasi-popt';
import { eq, inArray, sql } from 'drizzle-orm';
import { kecamatan } from '../db/schema/kecamatan';
import { opt } from '../db/schema/opt';
import { generateSuratPengajuanPestisida } from './helper/pengajuan-pestisida';

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
    const { rekomendasi_popt, sign_brigade } =
      value as InsertPengajuanPestisida & {
        rekomendasi_popt: { rekomendasi_popt_id: number }[];
      };

    if (!rekomendasi_popt || rekomendasi_popt.length === 0 || !sign_brigade) {
      return c.json(
        {
          status: 401,
          message:
            'data yang diperlukan tidak lengkap (rekomendasi_popt, sign_brigade)',
        },
        401
      );
    }

    return value;
  }),
  async (c) => {
    const { rekomendasi_popt, ...data } = c.req.valid(
      'json'
    ) as InsertPengajuanPestisida & {
      rekomendasi_popt: { rekomendasi_popt_id: number }[];
    };

    try {
      var insertData = await db
        .insert(pengajuanPestisida)
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

    const listRekomendasi = rekomendasi_popt.map(
      (val) => val.rekomendasi_popt_id
    );

    try {
      await db
        .update(rekomendasiPOPT)
        .set({ pengajuan_pestisida_id: insertData[0].id })
        .where(inArray(rekomendasiPOPT.id, listRekomendasi));
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

    const foo = await db
      .select({
        id: pengajuanPestisida.id,
        tanggal_pengajuan: pengajuanPestisida.tanggal_pengajuan,
        sign_brigade: pengajuanPestisida.sign_brigade,
        lampiran: pengajuanPestisida.lampiran,
        surat_pengajuan: pengajuanPestisida.surat_pengajuan,
        rekomendasi_popt: {
          ...rekomendasiPOPT,
          kecamatan: kecamatan,
          opt: opt,
        },
      })
      .from(pengajuanPestisida)
      .leftJoin(
        rekomendasiPOPT,
        eq(rekomendasiPOPT.pengajuan_pestisida_id, pengajuanPestisida.id)
      )
      .leftJoin(kecamatan, eq(rekomendasiPOPT.kecamatan_id, kecamatan.id))
      .leftJoin(opt, eq(opt.id, rekomendasiPOPT.opt_id))
      .where(eq(pengajuanPestisida.id, insertData[0].id));

    const result = foo.reduce((acc, row) => {
      const rekomendasi = row.rekomendasi_popt;

      if (!acc[row.id]) {
        acc[row.id] = { ...row, rekomendasi_popt: [rekomendasi] };
      } else {
        acc[row.id].rekomendasi_popt.push(rekomendasi);
      }
      return acc;
    }, {});

    const suratPengajuan = await generateSuratPengajuanPestisida(
      result[insertData[0].id]
    );

    try {
      await db
        .update(pengajuanPestisida)
        .set({ surat_pengajuan: suratPengajuan })
        .where(eq(pengajuanPestisida.id, insertData[0].id));
    } catch (error) {
      console.error(error);
      return c.json(
        {
          status: 500,
          message: error,
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
