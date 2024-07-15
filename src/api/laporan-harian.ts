import { Hono } from 'hono';
import { validator } from 'hono/validator';
import {
  InsertLaporanHarian,
  laporanHarian as laporanHarianSchema,
} from '../db/schema/laporan-harian.js';
import { db } from '../index.js';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { lokasi } from '../db/schema/lokasi.js';
import { pengamatan } from '../db/schema/pengamatan.js';
import { rumpun } from '../db/schema/rumpun.js';
import { detailRumpun } from '../db/schema/detail-rumpun.js';
import { hasilPengamatan, withPagination } from './helper.js';
import { authorizeApi } from '../middleware.js';
import { opt } from '../db/schema/opt.js';
import { tanaman } from '../db/schema/tanaman.js';
import { provinsi } from '../db/schema/provinsi.js';
import { kabupatenKota } from '../db/schema/kabupaten-kota.js';
import { kecamatan } from '../db/schema/kecamatan.js';
import { desa } from '../db/schema/desa.js';
import { user } from '../db/schema/user.js';

export const laporanHarian = new Hono();

laporanHarian.use('/laporan_harian/*', authorizeApi);

laporanHarian.post(
  '/laporan_harian',
  validator('json', (value, c) => {
    const { pengamatan_id, opt_id, lokasi_id, ...rest } =
      value as InsertLaporanHarian & {
        lokasi_id: string;
        lokasi_laporan_harian: { type: string; coordinates: [number, number] };
      };

    if (!pengamatan_id || !opt_id || !lokasi_id) {
      return c.json(
        {
          status: 401,
          message:
            'Tidak dapat melanjutkan permintaan. pengamatan_id, opt_id, lokasi_id tidak ditemukan',
        },
        401
      );
    }

    return { pengamatan_id, opt_id, lokasi_id, ...rest };
  }),
  async (c) => {
    const { lokasi_laporan_harian, lokasi_id, pengamatan_id, skala, ...rest } =
      c.req.valid('json');
    const [lat, long] = lokasi_laporan_harian.coordinates;

    try {
      var insertedData = await db
        .insert(laporanHarianSchema)
        .values({
          ...rest,
          pengamatan_id,
          skala,
          point_laporan_harian: sql`ST_SetSRID(ST_MakePoint(${long}, ${lat}), 4326)`,
        })
        .returning();
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

    if (insertedData.length === 0) {
      return c.json(
        {
          status: 404,
          message: 'Data tidak ditemukan',
        },
        404
      );
    }

    try {
      var updatedPengamatan = await db
        .update(pengamatan)
        .set({ status_laporan_harian: true })
        .where(eq(pengamatan.id, pengamatan_id))
        .returning();
    } catch (error) {
      return c.json({
        status: 500,
        message: 'internal server error',
      });
    }

    return c.json({
      status: 200,
      message: 'success',
      data: {
        id: insertedData[0].id,
        pengamatan_id,
        opt_id: insertedData[0].opt_id,
        status_laporan_harian: updatedPengamatan[0].status_laporan_harian,
      },
    });
  }
);
laporanHarian.put(
  '/laporan_harian/:laporanHarianId',
  validator('json', (value, c) => {
    const { lokasi_id, lokasi_laporan_harian, ...rest } =
      value as InsertLaporanHarian & {
        lokasi_id: string;
        lokasi_laporan_harian: {
          type: string;
          coordinates: [number, number];
        };
      };

    return { lokasi_id, lokasi_laporan_harian, ...rest };
  }),
  async (c) => {
    const laporanHarianId = c.req.param('laporanHarianId');
    const { lokasi_id, lokasi_laporan_harian, ...rest } = c.req.valid('json');

    try {
      await db
        .update(laporanHarianSchema)
        .set({ ...rest })
        .where(eq(laporanHarianSchema.id, parseInt(laporanHarianId)))
        .returning();
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
      message: 'Berhasil mengupdate laporan harian',
    });
  }
);
laporanHarian.delete('/laporan_harian/:laporanHarianId', async (c) => {
  const laporanHarianId = c.req.param('laporanHarianId');

  try {
    await db
      .delete(laporanHarianSchema)
      .where(eq(laporanHarianSchema.id, parseInt(laporanHarianId)));
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
    message: 'Berhasil menghapus data laporan harian',
  });
});
laporanHarian.get('/laporan_harian/:laporanHarianId', async (c) => {
  const laporanHarianId = c.req.param('laporanHarianId');

  const totalAnakan = db.$with('total_anakan').as(
    db
      .select({
        pengamatan_id: rumpun.pengamatan_id,
        total_anakan: sql`sum(${rumpun.jumlah_anakan})`.as(
          'total_jumlah_anakan'
        ),
      })
      .from(rumpun)
      .groupBy(rumpun.pengamatan_id)
  );
  const totalOpt = db.$with('total_opt').as(
    db
      .select({
        pengamatan_id: rumpun.pengamatan_id,
        skala_kerusakan: detailRumpun.skala_kerusakan,
        total_opt: sql`sum(${detailRumpun.jumlah_opt})`.as('total_jumlah_opt'),
        opt_id: detailRumpun.opt_id,
        kode_opt: opt.kode_opt,
      })
      .from(detailRumpun)
      .leftJoin(rumpun, eq(detailRumpun.rumpun_id, rumpun.id))
      .leftJoin(opt, eq(opt.id, detailRumpun.opt_id))
      .leftJoin(tanaman, eq(tanaman.id, opt.tanaman_id))
      .groupBy(
        detailRumpun.opt_id,
        detailRumpun.skala_kerusakan,
        rumpun.pengamatan_id,
        opt.kode_opt
      )
  );

  const laporanHarianQuery = await db
    .with(totalAnakan, totalOpt)
    .select({
      laporan_harian: laporanHarianSchema,
      pengamatan: pengamatan,
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
      lokasi: {
        ...lokasi,
        provinsi: provinsi,
        kabupaten_kota: kabupatenKota,
        kecamatan: kecamatan,
        desa: desa,
      },
      pic: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        photo: user.photo,
        validasi: user.validasi,
      },
    })
    .from(laporanHarianSchema)
    .leftJoin(
      totalAnakan,
      eq(totalAnakan.pengamatan_id, laporanHarianSchema.pengamatan_id)
    )
    .leftJoin(
      totalOpt,
      eq(totalOpt.pengamatan_id, laporanHarianSchema.pengamatan_id)
    )
    .leftJoin(pengamatan, eq(pengamatan.id, laporanHarianSchema.pengamatan_id))
    .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
    .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
    .leftJoin(desa, eq(desa.id, lokasi.desa_id))
    .leftJoin(user, eq(user.id, laporanHarianSchema.pic_id))
    .where(eq(laporanHarianSchema.id, parseInt(laporanHarianId)));

  if (laporanHarianQuery.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'Laporan harian tidak ditemukan',
      },
      404
    );
  }

  const res = laporanHarianQuery.reduce((acc, row) => {
    const totalAnakan = row.total_anakan;
    const totalOpt = row.total_opt;
    const laporanHarian = row.laporan_harian;
    const pengamatan = row.pengamatan;
    const lokasi = row.lokasi;
    const pic = row.pic;
    const perhitungan = hasilPengamatan(
      totalOpt.skala_kerusakan,
      totalOpt.total_opt as number,
      totalAnakan.total_anakan as number
    );
    const hasilPerhitungan = {
      id_opt: totalOpt.opt_id,
      kode_opt: totalOpt.kode_opt,
      hasil_perhitungan: perhitungan,
      skala: totalOpt.skala_kerusakan,
    };

    if (!acc[laporanHarian.id]) {
      acc[laporanHarian.id] = {
        ...laporanHarian,
        pengamatan,
        lokasi,
        pic,
        hasil_pengamatan: [hasilPerhitungan],
      };
    } else if (acc[laporanHarian.id]) {
      acc[laporanHarian.id].hasil_pengamatan.push(hasilPerhitungan);
    }

    return acc;
  }, {});

  return c.json({
    status: 200,
    message: 'success',
    data: res[laporanHarianId],
  });
});
laporanHarian.get(
  '/laporan_harian',
  validator('query', (value) => {
    const query = value as Record<
      | 'user_id'
      | 'location_id'
      | 'tanggal'
      | 'start_date'
      | 'end_date'
      | 'page'
      | 'per_page',
      string
    >;
    return query;
  }),
  async (c) => {
    const {
      start_date,
      end_date,
      location_id,
      tanggal,
      user_id,
      page,
      per_page,
    } = c.req.valid('query');

    const totalAnakan = db.$with('total_anakan').as(
      db
        .select({
          pengamatan_id: rumpun.pengamatan_id,
          total_anakan: sql<number>`sum(${rumpun.jumlah_anakan})`.as(
            'total_jumlah_anakan'
          ),
        })
        .from(rumpun)
        .groupBy(rumpun.pengamatan_id)
    );
    const totalOpt = db.$with('total_opt').as(
      db
        .select({
          pengamatan_id: rumpun.pengamatan_id,
          skala_kerusakan: detailRumpun.skala_kerusakan,
          total_opt: sql<number>`sum(${detailRumpun.jumlah_opt})`.as(
            'total_jumlah_opt'
          ),
          opt_id: detailRumpun.opt_id,
          kode_opt: opt.kode_opt,
        })
        .from(detailRumpun)
        .leftJoin(rumpun, eq(detailRumpun.rumpun_id, rumpun.id))
        .leftJoin(opt, eq(opt.id, detailRumpun.opt_id))
        .leftJoin(tanaman, eq(tanaman.id, opt.tanaman_id))
        .groupBy(
          detailRumpun.opt_id,
          detailRumpun.skala_kerusakan,
          rumpun.pengamatan_id,
          opt.kode_opt
        )
    );

    const query = db
      .with(totalAnakan, totalOpt)
      .select({
        laporan_harian: {
          ...laporanHarianSchema,
          hari_ke: pengamatan.hari_ke,
          blok: pengamatan.blok,
        },
        total_anakan: {
          pengamatan_id: totalAnakan.pengamatan_id,
          total_anakan: totalAnakan.total_anakan,
        },
        total_opt: {
          pengamatan_id: totalOpt.pengamatan_id,
          opt_id: totalOpt.opt_id,
          kode_opt: totalOpt.kode_opt,
          total_opt: totalOpt.total_opt,
          skala_kerusakan: totalOpt.skala_kerusakan,
        },
        lokasi: {
          ...lokasi,
          provinsi,
          kabupaten_kota: kabupatenKota,
          kecamatan,
          desa,
        },
      })
      .from(laporanHarianSchema)
      .leftJoin(
        totalAnakan,
        eq(totalAnakan.pengamatan_id, laporanHarianSchema.pengamatan_id)
      )
      .leftJoin(
        totalOpt,
        eq(totalOpt.pengamatan_id, laporanHarianSchema.pengamatan_id)
      )
      .leftJoin(
        pengamatan,
        eq(pengamatan.id, laporanHarianSchema.pengamatan_id)
      )
      .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
      .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
      .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
      .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
      .leftJoin(desa, eq(desa.id, lokasi.desa_id))
      .where(
        and(
          !!user_id
            ? eq(laporanHarianSchema.pic_id, parseInt(user_id))
            : undefined,
          !!location_id ? eq(lokasi.id, location_id) : undefined,
          !!tanggal
            ? eq(laporanHarianSchema.tanggal_laporan_harian, tanggal)
            : undefined,
          !!start_date
            ? gte(laporanHarianSchema.tanggal_laporan_harian, start_date)
            : undefined,
          !!end_date
            ? lte(laporanHarianSchema.tanggal_laporan_harian, end_date)
            : undefined
        )
      )
      .$dynamic();

    const paginatedQuery = withPagination(
      query,
      parseInt(page),
      parseInt(per_page)
    );

    try {
      var selectData = await paginatedQuery;
    } catch (error) {
      console.error(error);
      return c.json({
        status: 500,
        message: 'internal server error',
      });
    }

    if (selectData.length === 0) {
      return c.json(
        {
          status: 404,
          message: 'Data laporan harian tidak ditemukan',
        },
        404
      );
    }

    const result = selectData.reduce((acc, row) => {
      const laporanHarian = row.laporan_harian;
      const totalAnakan = row.total_anakan;
      const totalOpt = row.total_opt;
      const lokasi = row.lokasi;

      const hasilPerhitungan = hasilPengamatan(
        totalOpt.skala_kerusakan,
        totalOpt.total_opt,
        totalAnakan.total_anakan
      );
      const hasil = {
        opt_id: totalOpt.opt_id,
        kode_opt: totalOpt.kode_opt,
        hasil_perhitungan: hasilPerhitungan,
        skala: totalOpt.skala_kerusakan,
      };

      const finalRow = {
        laporan_harian: laporanHarian,
        lokasi,
        hasil_pengamatan: [hasil],
      };

      const laporan = acc.find(
        (value) => value.laporan_harian.id === laporanHarian.id
      );

      if (!laporan) {
        acc.push(finalRow);
      } else if (!!laporan) {
        acc[acc.indexOf(laporan)].hasil_pengamatan.push(hasil);
      }

      return acc;
    }, []);

    return c.json({
      status: 200,
      message: 'success',
      data: result,
    });
  }
);
