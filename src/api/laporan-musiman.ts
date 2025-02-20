import { Hono } from 'hono';
import { validator } from 'hono/validator';
import {
  InsertLaporanMusiman,
  LaporanMusiman,
  laporanMusiman as laporanMusimanSchema,
} from '../db/schema/laporan-musiman';
import { db } from '../index';
import { and, eq, gte, lte } from 'drizzle-orm';
import { LaporanBulanan, laporanBulanan } from '../db/schema/laporan-bulanan';
import { user } from '../db/schema/user';
import { laporanSb } from '../db/schema/laporan-sb';
import { laporanHarian } from '../db/schema/laporan-harian';
import { pengamatan } from '../db/schema/pengamatan';
import { Lokasi, lokasi } from '../db/schema/lokasi';
import { authorizeApi } from '../middleware';
import { validasiLaporan } from '../db/schema/validasi-laporan';

export const laporanMusiman = new Hono();
laporanMusiman.use('/laporan_musiman/*', authorizeApi);

laporanMusiman.post(
  '/laporan_musiman',
  validator('json', (value, c) => {
    const { opt_id, pic_id, ...rest } = value as InsertLaporanMusiman & {
      lokasi_id: string;
      lokasi_laporan_bulanan: {
        type: string;
        coordinates: [number, number];
      };
    };

    if (!opt_id || !pic_id) {
      return c.json(
        {
          status: 401,
          message:
            'Permintaan tidak dapat dilanjutkan. Kekurangan data opt_id atau pic_id',
        },
        401
      );
    }

    return { opt_id, pic_id, ...rest };
  }),
  async (c) => {
    const { lokasi_id, lokasi_laporan_bulanan, ...rest } = c.req.valid('json');
    const [lat, long] = lokasi_laporan_bulanan.coordinates;

    try {
      var insertLaporan = await db
        .insert(laporanMusimanSchema)
        .values({ ...rest, point: [lat, long] })
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

    try {
      await db
        .insert(validasiLaporan)
        .values({ laporan_musiman_id: insertLaporan[0].id });
    } catch (error) {
      console.error(error);
      return c.json(
        {
          status: 500,
          message: 'error creating table validasi laporan',
        },
        500
      );
    }

    return c.json({
      status: 200,
      message: 'success',
      data: insertLaporan[0],
    });
  }
);
laporanMusiman.put(
  '/laporan_musiman/:laporanMusimanId',
  validator('json', (value, c) => {
    const { opt_id, pic_id, ...rest } = value as InsertLaporanMusiman & {
      lokasi_id: string;
      lokasi_laporan_musiman: {
        type: string;
        coordinates: [number, number];
      };
    };

    if (!opt_id || !pic_id) {
      return c.json(
        {
          status: 401,
          message:
            'Tidak dapat melanjutkan permintaan. Kekurangan data opt_id atau pic_id',
        },
        401
      );
    }

    return { opt_id, pic_id, ...rest };
  }),
  async (c) => {
    const laporanMusimanId = c.req.param('laporanMusimanId');
    const { lokasi_laporan_musiman, lokasi_id, ...rest } = c.req.valid('json');
    const [lat, long] = lokasi_laporan_musiman.coordinates;

    try {
      var updateData = await db
        .update(laporanMusimanSchema)
        .set({ point: [lat, long], ...rest })
        .where(eq(laporanMusimanSchema.id, parseInt(laporanMusimanId)))
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
      message: 'success',
      data: updateData[0],
    });
  }
);
laporanMusiman.delete('/laporan_musiman/:laporanMusimanId', async (c) => {
  const laporanMusimanId = c.req.param('laporanMusimanId');

  try {
    await db
      .delete(laporanMusimanSchema)
      .where(eq(laporanMusimanSchema.id, parseInt(laporanMusimanId)));
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
    message: 'berhasil menghapus laporan',
  });
});
laporanMusiman.get('/laporan_musiman/:laporanMusimanId', async (c) => {
  const laporanMusimanId = parseInt(c.req.param('laporanMusimanId'));

  try {
    var selectLaporan = await db
      .select({ laporanMusiman: laporanMusimanSchema, laporanBulanan, lokasi })
      .from(laporanMusimanSchema)
      .leftJoin(
        laporanBulanan,
        eq(laporanBulanan.laporan_musiman_id, laporanMusimanSchema.id)
      )
      .leftJoin(laporanSb, eq(laporanSb.laporan_bulanan_id, laporanBulanan.id))
      .leftJoin(laporanHarian, eq(laporanHarian.id_laporan_sb, laporanSb.id))
      .leftJoin(pengamatan, eq(pengamatan.id, laporanHarian.pengamatan_id))
      .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
      .leftJoin(
        validasiLaporan,
        eq(validasiLaporan.laporan_musiman_id, laporanMusimanSchema.id)
      )
      .where(eq(laporanMusimanSchema.id, laporanMusimanId));
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

  if (selectLaporan.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'Laporan tidak ditemukan',
      },
      404
    );
  }

  const result = selectLaporan.reduce<
    Record<
      number,
      {
        laporan_musiman: LaporanMusiman;
        laporan_bulanan: LaporanBulanan[];
        lokasi: Lokasi | null;
      }
    >
  >((acc, row) => {
    const laporanMusiman = row.laporanMusiman;
    const laporanBulanan = row.laporanBulanan;
    const lokasi = row.lokasi;

    if (!acc[laporanMusiman.id]) {
      acc[laporanMusiman.id] = {
        laporan_musiman: laporanMusiman,
        laporan_bulanan: [],
        lokasi: null,
      };
    }

    if (laporanBulanan) {
      acc[laporanMusiman.id].laporan_bulanan.push(laporanBulanan);
    }

    if (lokasi) {
      acc[laporanMusiman.id].lokasi = lokasi;
    }

    return acc;
  }, {});

  return c.json({
    status: 200,
    message: 'success',
    data: result,
  });
});
laporanMusiman.get('/laporan_musiman', async (c) => {
  const {
    user_id,
    location_id,
    start_date,
    end_date,
    per_page,
    page,
    kabkot_id,
    kecamatan_id,
    desa_id,
  } = c.req.query() as Record<
    | 'user_id'
    | 'location_id'
    | 'kabkot_id'
    | 'kecamatan_id'
    | 'desa_id'
    | 'start_date'
    | 'end_date'
    | 'per_page'
    | 'page',
    string
  >;

  const limit = parseInt(per_page || '10');
  const offset = (parseInt(page || '1') - 1) * limit;

  try {
    var selectLaporan = await db
      .select()
      .from(laporanMusimanSchema)
      .leftJoin(
        laporanBulanan,
        eq(laporanBulanan.laporan_musiman_id, laporanMusimanSchema.id)
      )
      .leftJoin(
        validasiLaporan,
        eq(validasiLaporan.laporan_musiman_id, laporanMusimanSchema.id)
      )
      .where(
        and(
          !!user_id ? eq(user.id, parseInt(user_id)) : undefined,
          !!location_id ? eq(lokasi.id, location_id) : undefined,
          !!kabkot_id ? eq(lokasi.kabkot_id, kabkot_id) : undefined,
          !!kecamatan_id ? eq(lokasi.kecamatan_id, kecamatan_id) : undefined,
          !!desa_id ? eq(lokasi.desa_id, desa_id) : undefined,
          !!start_date
            ? gte(laporanMusimanSchema.start_date, start_date)
            : undefined,
          !!end_date ? lte(laporanMusimanSchema, end_date) : undefined
        )
      )
      .limit(limit)
      .offset(offset);
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

  if (selectLaporan.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'Laporan tidak ditemukan',
      },
      404
    );
  }

  return c.json({
    status: 200,
    message: 'success',
    data: selectLaporan,
  });
});
