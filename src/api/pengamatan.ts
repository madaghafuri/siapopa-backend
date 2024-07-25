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
import { InsertRumpun, rumpun as rumpunSchema } from '../db/schema/rumpun.js';
import { hasilPengamatan, validateFile, withPagination } from './helper.js';
import { authorizeApi } from '../middleware.js';
import { opt } from '../db/schema/opt.js';
import { SelectTanaman, tanaman } from '../db/schema/tanaman.js';
import { Lokasi, lokasi } from '../db/schema/lokasi.js';
import { provinsi } from '../db/schema/provinsi.js';
import { kabupatenKota } from '../db/schema/kabupaten-kota.js';
import { kecamatan } from '../db/schema/kecamatan.js';
import { desa } from '../db/schema/desa.js';
import { SelectUser, user } from '../db/schema/user.js';
import { laporanHarian } from '../db/schema/laporan-harian.js';

export const pengamatan = new Hono<{ Variables: JwtVariables }>();
pengamatan.use('/pengamatan/*', authorizeApi);

pengamatan.post(
  '/pengamatan',
  validator('json', (value, c) => {
    type RumpunPengamatan = InsertRumpun & {
      detail_rumpun: DetailRumpun[];
    };
    const { lokasi_id, tanaman_id, ...rest } = value as Pengamatan & {
      lokasi_pengamatan: {
        type: string;
        coordinates: [number, number];
      };
      bukti_pengamatan: string[];
      rumpun: RumpunPengamatan[];
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
    const { lokasi_pengamatan, bukti_pengamatan, rumpun, ...rest } =
      c.req.valid('json');

    const [lat, long] = lokasi_pengamatan.coordinates;

    try {
      var insertedData = await db
        .insert(pengamatanSchema)
        .values({
          ...rest,
          point_pengamatan: [lat, long],
        })
        .returning();

      const photoValue: Partial<PhotoPengamatan>[] = bukti_pengamatan.map(
        (val) => ({
          path: val,
          pengamatan_id: insertedData[0].id,
        })
      );

      if (rumpun.length > 0) {
        const rumpunData: InsertRumpun[] = rumpun.map(
          ({ rumpun_ke, jumlah_anakan, luas_spot_hopperburn }) => ({
            rumpun_ke,
            jumlah_anakan,
            luas_spot_hopperburn,
            pengamatan_id: insertedData[0].id,
          })
        );

        var insertRumpun = await db
          .insert(rumpunSchema)
          .values(rumpunData)
          .returning();

        const detailRumpunData = rumpun
          .map((val) => {
            const dataRumpun = insertRumpun.find(
              (rumpun) => rumpun.rumpun_ke === val.rumpun_ke
            );

            const detailRumpunList = val.detail_rumpun.map((dRumpun) => {
              return { ...dRumpun, rumpun_id: dataRumpun?.id };
            });

            return detailRumpunList;
          })
          .flat();

        await db.insert(detailRumpun).values(detailRumpunData);
        await db.insert(photoPengamatan).values(photoValue);
      }
    } catch (error) {
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
          detailRumpun: {
            with: {
              opt: true,
            },
          },
        },
      },
      tanaman: true,
      locations: {
        with: {
          provinsi: true,
          kabupaten_kota: true,
          kecamatan: true,
          desa: true,
        },
      },
      pic: {
        columns: {
          password: false,
        },
      },
      bukti_pengamatan: true,
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

  const hasil_pengamatan = totalOpt.map((value) => {
    return {
      opt_id: value.opt_id,
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

  const totalAnakan = db.$with('total_anakan').as(
    db
      .select({
        pengamatan_id: rumpunSchema.pengamatan_id,
        total_anakan: sql`sum(${rumpunSchema.jumlah_anakan})`.as(
          'total_jumlah_anakan'
        ),
      })
      .from(rumpunSchema)
      .groupBy(rumpunSchema.pengamatan_id)
  );
  const totalOpt = db.$with('total_opt').as(
    db
      .select({
        pengamatan_id: rumpunSchema.pengamatan_id,
        skala_kerusakan: detailRumpun.skala_kerusakan,
        total_opt: sql`sum(${detailRumpun.jumlah_opt})`.as('total_jumlah_opt'),
        opt_id: detailRumpun.opt_id,
        kode_opt: opt.kode_opt,
      })
      .from(detailRumpun)
      .leftJoin(rumpunSchema, eq(detailRumpun.rumpun_id, rumpunSchema.id))
      .leftJoin(opt, eq(opt.id, detailRumpun.opt_id))
      .leftJoin(tanaman, eq(tanaman.id, opt.tanaman_id))
      .groupBy(
        detailRumpun.opt_id,
        detailRumpun.skala_kerusakan,
        rumpunSchema.pengamatan_id,
        opt.kode_opt
      )
  );

  const pengamatanQuery = db
    .with(totalAnakan, totalOpt)
    .select({
      pengamatan: pengamatanSchema,
      tanaman: tanaman,
      lokasi: {
        ...lokasi,
        provinsi: provinsi,
        kabupaten_kota: kabupatenKota,
        kecamatan: kecamatan,
        desa: desa,
      },
      total_anakan: {
        pengamatan_id: totalAnakan.pengamatan_id,
        total_anakan: totalAnakan.total_anakan,
      },
      total_opt: {
        pengamatan_id: totalOpt.pengamatan_id,
        skala_kerusakan: totalOpt.skala_kerusakan,
        total_opt: totalOpt.total_opt,
        opt_id: totalOpt.opt_id,
        kode_opt: totalOpt.kode_opt,
      },
      pic: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        photo: user.photo,
        validasi: user.validasi,
        usergroup_id: user.usergroup_id,
      },
      laporan_harian: laporanHarian,
    })
    .from(pengamatanSchema)
    .leftJoin(totalAnakan, eq(totalAnakan.pengamatan_id, pengamatanSchema.id))
    .leftJoin(totalOpt, eq(totalOpt.pengamatan_id, pengamatanSchema.id))
    .leftJoin(tanaman, eq(tanaman.id, pengamatanSchema.tanaman_id))
    .leftJoin(lokasi, eq(lokasi.id, pengamatanSchema.lokasi_id))
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
    .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
    .leftJoin(desa, eq(desa.id, lokasi.desa_id))
    .leftJoin(user, eq(user.id, pengamatanSchema.pic_id))
    .leftJoin(
      laporanHarian,
      eq(laporanHarian.pengamatan_id, pengamatanSchema.id)
    )
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
    .orderBy(pengamatanSchema.id)
    .$dynamic();
  try {
    const finalQuery = withPagination(
      pengamatanQuery,
      parseInt(page),
      parseInt(per_page)
    );
    var selectedPengamatan = await finalQuery;
  } catch (error) {
    return c.json(
      {
        status: 500,
        message: 'internal server error',
      },
      500
    );
  }

  const result = selectedPengamatan.reduce<
    Array<{
      pengamatan: Pengamatan;
      tanaman: SelectTanaman;
      lokasi: Lokasi;
      pic: SelectUser;
      hasil_pengamatan: {
        opt_id: number;
        kode_opt: string;
        hasil_perhitungan: number;
        skala: string;
      }[];
      bukti_pengamatan: PhotoPengamatan[];
    }>
  >((acc, row) => {
    const pengamatan = row.pengamatan;
    const tanaman = row.tanaman;
    const lokasi = row.lokasi;
    const pic = row.pic;
    const laporan_harian = row.laporan_harian;
    const totalAnakan = row.total_anakan;
    const totalOpt = row.total_opt;
    const perhitunganKerusakan = hasilPengamatan(
      totalOpt?.skala_kerusakan || 'mutlak',
      parseInt((totalOpt?.total_opt as string) || '0') || 0,
      parseInt((totalAnakan?.total_anakan as string) || '0') || 0
    );
    const hasil_pengamatan = {
      opt_id: totalOpt?.opt_id,
      kode_opt: totalOpt?.kode_opt,
      hasil_perhitungan: perhitunganKerusakan,
      skala: totalOpt?.skala_kerusakan,
    };
    const finalRow = {
      pengamatan,
      laporan_harian,
      tanaman,
      lokasi,
      pic,
      hasil_pengamatan: [hasil_pengamatan],
    };

    const foo = acc.find((val) => val.pengamatan.id === finalRow.pengamatan.id);

    if (!foo) {
      acc.push(
        finalRow as unknown as {
          pengamatan: Pengamatan;
          tanaman: SelectTanaman;
          lokasi: Lokasi;
          pic: SelectUser;
          hasil_pengamatan: {
            opt_id: number;
            kode_opt: string;
            hasil_perhitungan: number;
            skala: string;
          }[];
          bukti_pengamatan: PhotoPengamatan[];
        }
      );
    } else if (!!foo) {
      acc[acc.indexOf(foo)].hasil_pengamatan.push(
        hasil_pengamatan as unknown as {
          opt_id: number;
          kode_opt: string;
          hasil_perhitungan: number;
          skala: string;
        }
      );
    }

    return acc;
  }, []);

  if (selectedPengamatan.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'Data tidak ditemukan',
      },
      404
    );
  }

  const ids = result.map((pengamatan) => pengamatan.pengamatan.id);
  const photos = await db.query.photoPengamatan.findMany({
    where: inArray(photoPengamatan.pengamatan_id, ids),
  });
  result.forEach((value) => {
    const buktiPengamatan = photos.filter(
      (photo) => photo.pengamatan_id === value.pengamatan.id
    );

    if (buktiPengamatan.length > 0) {
      value.bukti_pengamatan = buktiPengamatan;
    } else {
      value.bukti_pengamatan = [];
    }
  });

  return c.json({
    status: 200,
    message: 'success',
    data: result,
  });
});
