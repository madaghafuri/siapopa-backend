import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { SelectUser, user } from '../db/schema/user';
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
import { rincianRekomendasiPOPT } from '../db/schema/rincian-rekomendasi-popt';
import { authorizeApi } from '../middleware';

export const pengajuanPestisidaRoute = new Hono<{
  Variables: {
    session: Session;
    user: Omit<SelectUser, 'password'> & {
      userGroup: SelectUserGroup;
      locations: Lokasi[];
    };
  };
}>().basePath('pengajuan-pestisida');
pengajuanPestisidaRoute.use('*', authorizeApi);

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

    const validRekomendasiPopt = db
      .select({
        id: rekomendasiPOPT.id,
        varietas: rekomendasiPOPT.varietas,
        umur_tanaman: rekomendasiPOPT.umur_tanaman,
        total_luas_serangan:
          sql`sum(${rincianRekomendasiPOPT.luas_serangan})`.as(
            'total_luas_serangan'
          ),
        jenis_pengendalian: rekomendasiPOPT.jenis_pengendalian,
        tanggal_rekomendasi_pengendalian:
          rekomendasiPOPT.tanggal_rekomendasi_pengendalian,
        ambang_lampau_pengendalian: rekomendasiPOPT.ambang_lampau_pengendalian,
        sign_popt: rekomendasiPOPT.sign_popt,
        surat_rekomendasi_popt: rekomendasiPOPT.surat_rekomendasi_popt,
        kabkot_id: rekomendasiPOPT.kabkot_id,
        popt_id: rekomendasiPOPT.popt_id,
        bahan_aktif_id: rekomendasiPOPT.bahan_aktif_id,
        pengajuan_pestisida_id: rekomendasiPOPT.pengajuan_pestisida_id,
        pengamatan_id: rekomendasiPOPT.pengamatan_id,
        created_at: rekomendasiPOPT.created_at,
        kecamatan: {
          // id: kecamatan.id,
          nama_kecamatan: kecamatan.nama_kecamatan,
        },
        opt: {
          // id: opt.id,
          nama_opt: opt.nama_opt,
        },
      })
      .from(rekomendasiPOPT)
      .leftJoin(kecamatan, eq(kecamatan.id, rekomendasiPOPT.kecamatan_id))
      .leftJoin(opt, eq(opt.id, rekomendasiPOPT.opt_id))
      .leftJoin(
        rincianRekomendasiPOPT,
        eq(rincianRekomendasiPOPT.rekomendasi_popt_id, rekomendasiPOPT.id)
      )
      .where(eq(rekomendasiPOPT.pengajuan_pestisida_id, insertData[0].id))
      .groupBy(rekomendasiPOPT.id, kecamatan.id, opt.id)
      .as('rekomendasi_popt');

    const foo = await db
      .select({
        pengajuan_pestisida: pengajuanPestisida,
        rekomendasi_popt: {
          id: validRekomendasiPopt.id,
          varietas: validRekomendasiPopt.varietas,
          umur_tanaman: validRekomendasiPopt.umur_tanaman,
          total_luas_serangan: validRekomendasiPopt.total_luas_serangan,
          jenis_pengendalian: validRekomendasiPopt.jenis_pengendalian,
          tanggal_rekomendasi_pengendalian:
            validRekomendasiPopt.tanggal_rekomendasi_pengendalian,
          ambang_lampau_pengendalian:
            validRekomendasiPopt.ambang_lampau_pengendalian,
          sign_popt: validRekomendasiPopt.sign_popt,
          surat_rekomendasi_popt: validRekomendasiPopt.surat_rekomendasi_popt,
          kabkot_id: validRekomendasiPopt.kabkot_id,
          popt_id: validRekomendasiPopt.popt_id,
          bahan_aktif_id: validRekomendasiPopt.bahan_aktif_id,
          pengajuan_pestisida_id: validRekomendasiPopt.pengajuan_pestisida_id,
          pengamatan_id: validRekomendasiPopt.pengamatan_id,
          kecamatan: validRekomendasiPopt.kecamatan.nama_kecamatan,
          opt: validRekomendasiPopt.opt.nama_opt,
          created_at: validRekomendasiPopt.created_at,
        },
        brigade: user,
      })
      .from(pengajuanPestisida)
      .leftJoin(user, eq(user.id, pengajuanPestisida.brigade_id))
      .leftJoin(
        validRekomendasiPopt,
        eq(validRekomendasiPopt.pengajuan_pestisida_id, pengajuanPestisida.id)
      )
      .where(eq(pengajuanPestisida.id, insertData[0].id));

    const result = foo.reduce((acc, row) => {
      const pengajuanPestisida = row.pengajuan_pestisida;
      const rekomendasi = row.rekomendasi_popt;
      const brigade = row.brigade;

      if (!acc[pengajuanPestisida.id]) {
        acc[pengajuanPestisida.id] = {
          ...pengajuanPestisida,
          brigade,
          rekomendasi_popt: [rekomendasi],
        };
      } else {
        acc[pengajuanPestisida.id].rekomendasi_popt.push(rekomendasi);
      }
      return acc;
    }, {});

    // const suratPengajuan = await generateSuratPengajuanPestisida(
    //   result[insertData[0].id]
    // );

    // try {
    //   await db
    //     .update(pengajuanPestisida)
    //     .set({ surat_pengajuan: suratPengajuan })
    //     .where(eq(pengajuanPestisida.id, insertData[0].id));
    // } catch (error) {
    //   console.error(error);
    //   return c.json(
    //     {
    //       status: 500,
    //       message: error,
    //     },
    //     500
    //   );
    // }

    return c.json({
      status: 200,
      message: 'success',
    });
  }
);
