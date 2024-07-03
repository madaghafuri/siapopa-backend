import { Hono } from 'hono';
import { JwtVariables } from 'hono/jwt';
import { validator } from 'hono/validator';
import {
  Pengamatan,
  pengamatan as pengamatanSchema,
} from '../db/schema/pengamatan.js';
import { db } from '../index.js';
import { SQL, and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import {
  PhotoPengamatan,
  photoPengamatan,
} from '../db/schema/photo-pengamatan.js';
import {
  DetailRumpun,
  Kerusakan,
  detailRumpun,
} from '../db/schema/detail-rumpun.js';
import {
  InsertRumpun,
  SelectRumpun,
  rumpun as rumpunSchema,
} from '../db/schema/rumpun.js';
import { hasilPengamatan, withPagination } from './helper.js';
import { authorizeApi } from '../middleware.js';
import { opt } from '../db/schema/opt.js';

export const pengamatan = new Hono<{ Variables: JwtVariables }>();
pengamatan.use('/pengamatan/*', authorizeApi);

pengamatan.post(
  '/pengamatan',
  validator('json', (value, c) => {
    const { lokasi_id, tanaman_id, ...rest } = value as Pengamatan & {
      lokasi_pengamatan: {
        type: string;
        coordinates: [number, number];
      };
      bukti_pengamatan: string[];
      rumpun: {
        rumpun_ke: number;
        jumlah_anakan: number;
        detail_rumpun: {
          opt_id: number;
          jumlah_opt: number;
          skala_kerusakan: Kerusakan;
          hama_id: number;
          jumlah_hama: number;
        }[];
      }[];
    };

    if (!lokasi_id || !tanaman_id) {
      return c.json(
        {
          status: 401,
          message: 'lokasi_id tidak ditemukan',
        },
        401
      );
    }
    const parsedValue = { lokasi_id, tanaman_id, ...rest };

    return parsedValue;
  }),
  // Context Route Handler
  async (c) => {
    const { lokasi_pengamatan, bukti_pengamatan, lokasi_id, rumpun, ...rest } =
      c.req.valid('json');

    const [lat, long] = lokasi_pengamatan.coordinates;

    try {
      var insertedData = await db
        .insert(pengamatanSchema)
        .values({ ...rest, point_pengamatan: [lat, long] })
        .returning();

      const photoValue: Partial<PhotoPengamatan>[] = bukti_pengamatan.map(
        (val) => ({
          path: val,
          pengamatan_id: insertedData[0].id,
        })
      );

      if (rumpun.length > 0) {
        const rumpunData: InsertRumpun[] = rumpun.map(
          ({ rumpun_ke, jumlah_anakan }) => ({
            rumpun_ke,
            jumlah_anakan,
            pengamatan_id: insertedData[0].id,
          })
        );

        var insertRumpun = await db
          .insert(rumpunSchema)
          .values(rumpunData)
          .returning();

        const detailRumpunData = rumpun.flatMap((val) => {
          const dataRumpun = insertRumpun.find(
            (val) => val.rumpun_ke === val.rumpun_ke
          );
          const li = val.detail_rumpun.map((val) => {
            return { ...val, rumpun_id: dataRumpun?.id };
          });
          return li;
        });

        await db.insert(detailRumpun).values(detailRumpunData);
      }

      await db.insert(photoPengamatan).values(photoValue);
    } catch (error) {
      console.error(error);
      return c.json(
        {
          status: 500,
          message: 'internal server error',
        },
        500
      );
    }

    return c.json({
      status: 200,
      message: 'Berhasil membuat data pengamatan',
      data: insertedData[0],
    });
  }
);
pengamatan.put(
  '/pengamatan/:pengamatanId',
  validator('param', (value, c) => {
    const pengamatanId = value['pengamatanId'];
    if (!pengamatanId)
      return c.json(
        {
          status: 401,
          message: 'parameter pengamatan_id harus berada di url',
        },
        401
      );
    return pengamatanId;
  }),

  validator('json', (value, c) => {
    const { lokasi_id, lokasi_pengamatan, pic_id, ...rest } =
      value as Pengamatan & {
        lokasi_pengamatan: {
          type: 'Point' | 'Polygon';
          coordinates: [number, number];
        };
        bukti_pengamatan: {
          bukti_pengamatan_id: number;
          photo_pengamatan: string;
        }[];
      };

    if (!lokasi_id || !lokasi_pengamatan || !pic_id) {
      return c.json(
        {
          status: 401,
          message:
            'Permintaan harus memiliki lokasi_id, lokasi_pengamatan, dan pic_id',
        },
        401
      );
    }

    return { lokasi_id, lokasi_pengamatan, pic_id, ...rest };
  }),
  async (c) => {
    const pengamatanId = c.req.param('pengamatanId');
    const { lokasi_pengamatan, bukti_pengamatan, point_pengamatan, ...rest } =
      c.req.valid('json');
    const [lat, long] = lokasi_pengamatan.coordinates;

    try {
      var updatedData = await db
        .update(pengamatanSchema)
        .set({ point_pengamatan: [lat, long], ...rest })
        .where(eq(pengamatanSchema.id, parseInt(pengamatanId)))
        .returning();

      const sqlChunks: SQL[] = [];
      const ids: number[] = [];
      sqlChunks.push(sql`(case`);
      for (const input of bukti_pengamatan) {
        sqlChunks.push(
          sql`when id = ${input.bukti_pengamatan_id} then ${input.photo_pengamatan}`
        );
        ids.push(input.bukti_pengamatan_id);
      }
      sqlChunks.push(sql`end)`);

      await db
        .update(photoPengamatan)
        .set({ path: sql.join(sqlChunks, sql.raw(' ')) })
        .where(
          and(
            inArray(photoPengamatan.id, ids),
            eq(photoPengamatan.pengamatan_id, parseInt(pengamatanId))
          )
        );
    } catch (error) {
      console.error(error);
      return c.json({
        status: 500,
        message: 'internal server error',
      });
    }

    return c.json({
      status: 200,
      message: 'success',
      data: updatedData[0],
    });
  }
);
pengamatan.delete('/pengamatan/:pengamatanId', async (c) => {
  const pengamatanId = c.req.param('pengamatanId');

  try {
    await db
      .delete(pengamatanSchema)
      .where(eq(pengamatanSchema.id, parseInt(pengamatanId)));
  } catch (error) {
    console.error(error);
    return c.json(
      {
        status: 500,
        message: 'internal server error',
      },
      500
    );
  }

  return c.json({
    status: 200,
    message: 'success',
  });
});
pengamatan.get('/pengamatan/:pengamatanId', async (c) => {
  const pengamatanId = c.req.param('pengamatanId');

  const data = await db.query.pengamatan.findFirst({
    with: {
      rumpun: {
        with: {
          detailRumpun: true,
        },
      },
      tanaman: true,
      lokasi: true,
    },
    where: eq(pengamatanSchema.id, parseInt(pengamatanId)),
  });

  const totalAnakan = await db
    .select({
      pengamatan_id: rumpunSchema.pengamatan_id,
      total: sql<number>`sum(${rumpunSchema.jumlah_anakan})`,
    })
    .from(rumpunSchema)
    .where(eq(rumpunSchema.pengamatan_id, parseInt(pengamatanId)))
    .groupBy(rumpunSchema.pengamatan_id);

  const totalOpt = await db
    .select({
      pengamatan_id: rumpunSchema.pengamatan_id,
      opt_id: detailRumpun.opt_id,
      kode_opt: opt.kode_opt,
      skala: detailRumpun.skala_kerusakan,
      total: sql<number>`sum(${detailRumpun.jumlah_opt})`,
    })
    .from(detailRumpun)
    .leftJoin(rumpunSchema, eq(rumpunSchema.id, detailRumpun.rumpun_id))
    .leftJoin(opt, eq(opt.id, detailRumpun.opt_id))
    .where(eq(rumpunSchema.pengamatan_id, parseInt(pengamatanId)))
    .groupBy(
      detailRumpun.opt_id,
      detailRumpun.skala_kerusakan,
      rumpunSchema.pengamatan_id,
      opt.kode_opt
    );

  const hasil_pengamatan = totalOpt.map((value, index) => {
    return {
      kode_opt: value.kode_opt,
      hasil_perhitungan: hasilPengamatan(
        value.skala,
        value.total,
        totalAnakan[0].total
      ),
      skala: value.skala,
    };
  });

  if (!data) {
    return c.json({
      status: 404,
      message: 'data tidak ditemukan',
    });
  }

  return c.json({
    status: 200,
    message: 'success',
    data: { ...data, hasil_pengamatan },
  });
});
pengamatan.get('/pengamatan', async (c) => {
  const {
    page,
    per_page,
    lokasi_id,
    user_id,
    tanggal_pengamatan,
    start_date,
    end_date,
  } = c.req.query() as Record<
    | 'lokasi_id'
    | 'user_id'
    | 'tanggal_pengamatan'
    | 'page'
    | 'per_page'
    | 'start_date'
    | 'end_date',
    string
  >;

  const pengamatanQuery = db
    .select()
    .from(pengamatanSchema)
    .where(
      and(
        !!lokasi_id ? eq(pengamatanSchema.lokasi_id, lokasi_id) : undefined,
        !!user_id ? eq(pengamatanSchema.pic_id, parseInt(user_id)) : undefined,
        !!tanggal_pengamatan
          ? eq(pengamatanSchema.tanggal_pengamatan, tanggal_pengamatan)
          : undefined,
        !!start_date
          ? gte(pengamatanSchema.tanggal_pengamatan, start_date)
          : undefined,
        !!end_date
          ? lte(pengamatanSchema.tanggal_pengamatan, end_date)
          : undefined
      )
    )
    .$dynamic();

  try {
    const finalQuery = withPagination(
      pengamatanQuery,
      parseInt(page),
      parseInt(per_page)
    );
    var selectedPengamatan = await finalQuery;
  } catch (error) {
    console.error(error);
    return c.json(
      {
        status: 500,
        message: 'internal server error',
      },
      500
    );
  }

  if (selectedPengamatan.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'Data tidak ditemukan',
      },
      404
    );
  }

  return c.json({
    status: 200,
    message: 'success',
    data: selectedPengamatan,
  });
});
