import { Hono } from 'hono';
import { validator } from 'hono/validator';
import {
  InsertLaporanSb,
  laporanSb as laporanSbSchema,
} from '../db/schema/laporan-sb.js';
import {
  KategoriKerusakan,
  KategoriSerangan,
  luasKerusakanSb,
} from '../db/schema/luas-kerusakan-sb.js';
import { db } from '../index.js';
import { SQL, and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { laporanHarian } from '../db/schema/laporan-harian.js';
import { pengamatan } from '../db/schema/pengamatan.js';
import { authorizeApi } from '../middleware.js';

export const laporanSb = new Hono();
laporanSb.use('/laporan_sb/*', authorizeApi);

laporanSb.post(
  '/laporan_sb',
  validator('json', (value, c) => {
    const { opt_id, lokasi_id, pic_id, ...rest } = value as InsertLaporanSb & {
      lokasi_laporan_setengah_bulanan: {
        type: string;
        coordinates: [number, number];
      };
      lokasi_id: string;
      luas_kerusakan: {
        kategori_serangan: KategoriSerangan;
        kategori_kerusakan: KategoriKerusakan;
        luas_kerusakan: number;
      }[];
    };

    if (!opt_id || !lokasi_id || !pic_id) {
      return c.json(
        {
          status: 401,
          message: 'missing required parameter opt_id, lokasi_id, pic_id',
        },
        401
      );
    }
    return { opt_id, lokasi_id, pic_id, ...rest };
  }),
  async (c) => {
    const { lokasi_laporan_setengah_bulanan, ...rest } = c.req.valid('json');
    const [lat, long] = lokasi_laporan_setengah_bulanan.coordinates;

    try {
      var insertedData = await db
        .insert(laporanSbSchema)
        .values({ point_laporan_sb: [lat, long], ...rest })
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
      data: insertedData[0],
    });
  }
);
laporanSb.put(
  '/laporan_sb/:laporanSbId',
  validator('json', (value) => {
    const query = value as InsertLaporanSb & {
      lokasi_laporan_setengah_bulanan: {
        type: string;
        coordinates: [number, number];
      };
      lokasi_id: string;
      luas_kerusakan: {
        kategori_serangan: KategoriSerangan;
        kategori_kerusakan: KategoriKerusakan;
        luas_kerusakan: number;
        luas_kerusakan_sb_id: number;
      }[];
    };

    return query;
  }),
  async (c) => {
    const laporanSbId = c.req.param('laporanSbId');
    const {
      lokasi_laporan_setengah_bulanan,
      lokasi_id,
      luas_kerusakan,
      ...rest
    } = c.req.valid('json');
    const [lat, long] = lokasi_laporan_setengah_bulanan.coordinates;

    const luasChunks: SQL[] = [];
    const seranganChunks: SQL[] = [];
    const kerusakanChunks: SQL[] = [];
    const ids: number[] = [];
    luasChunks.push(sql`(case`);
    seranganChunks.push(sql`(case`);
    kerusakanChunks.push(sql`(case`);
    for (const input of luas_kerusakan) {
      luasChunks.push(
        sql`when id = ${input.luas_kerusakan_sb_id} then ${input.luas_kerusakan}`
      );
      seranganChunks.push(
        sql`when id = ${input.luas_kerusakan_sb_id} then ${input.kategori_serangan}`
      );
      kerusakanChunks.push(
        sql`when id = ${input.luas_kerusakan_sb_id} then ${input.kategori_kerusakan}`
      );
      ids.push(input.luas_kerusakan_sb_id);
    }
    luasChunks.push(sql`end)`);
    seranganChunks.push(sql`end)`);
    kerusakanChunks.push(sql`end)`);

    try {
      var updatedData = await db
        .update(laporanSbSchema)
        .set({ point_laporan_sb: [lat, long], ...rest })
        .where(eq(laporanSbSchema.id, parseInt(laporanSbId)))
        .returning();

      var updatedLuasKerusakan = await db
        .update(luasKerusakanSb)
        .set({
          luas_kerusakan: sql.join(luasChunks, sql.raw(' ')),
          kategori_serangan: sql.join(seranganChunks, sql.raw(' ')),
          kategori_kerusakan: sql.join(kerusakanChunks, sql.raw(' ')),
        })
        .where(inArray(luasKerusakanSb.id, ids))
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
      message: 'Berhasil mengupdate laporan setengah bulan',
      data: {
        ...updatedData[0],
        luas_kerusakan: updatedLuasKerusakan,
      },
    });
  }
);
laporanSb.delete('/laporan_sb/:laporanSbId', async (c) => {
  const laporanSbId = c.req.param('laporanSbId');

  try {
    await db
      .delete(laporanSbSchema)
      .where(eq(laporanSbSchema.id, parseInt(laporanSbId)));
  } catch (error) {
    console.error(error);
    return c.json({
      status: 500,
      message: 'internal server error',
    });
  }

  return c.json({
    status: 200,
    message: 'Berhasil menghapus laporan setengah bulan',
  });
});
laporanSb.get('/laporan_sb/:laporanSbId', async (c) => {
  const laporanSbId = c.req.param('laporanSbId');

  try {
    var selectData = await db
      .select()
      .from(laporanSbSchema)
      .leftJoin(
        luasKerusakanSb,
        eq(luasKerusakanSb.laporan_sb_id, laporanSbSchema.id)
      )
      .where(eq(laporanSbSchema.id, parseInt(laporanSbId)));
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

  if (selectData.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'Laporan setengah bulan tidak ditemukan',
      },
      404
    );
  }

  return c.json({
    status: 200,
    message: 'success',
    data: selectData[0],
  });
});
laporanSb.get('/laporan_sb', async (c) => {
  const { user_id, location_id, start_date, end_date } =
    c.req.query() as Record<
      'user_id' | 'location_id' | 'start_date' | 'end_date',
      string
    >;

  try {
    var selectData = await db
      .select()
      .from(laporanSbSchema)
      .leftJoin(
        luasKerusakanSb,
        eq(luasKerusakanSb.laporan_sb_id, laporanSbSchema.id)
      )
      .leftJoin(
        laporanHarian,
        eq(laporanHarian.id_laporan_sb, laporanSbSchema.id)
      )
      .leftJoin(pengamatan, eq(pengamatan.id, laporanHarian.pengamatan_id))
      .where(
        and(
          !!user_id ? eq(laporanSbSchema.pic_id, parseInt(user_id)) : undefined,
          !!location_id ? eq(pengamatan.lokasi_id, location_id) : undefined,
          !!start_date
            ? gte(laporanSbSchema.start_date, start_date)
            : undefined,
          !!end_date ? lte(laporanSbSchema.end_date, end_date) : undefined
        )
      );
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

  if (selectData.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'Laporan setengah bulan tidak ditemukan',
      },
      404
    );
  }

  return c.json({
    status: 200,
    message: 'success',
    data: selectData,
  });
});
