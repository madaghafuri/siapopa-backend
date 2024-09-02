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
import { SQL, and, asc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { laporanHarian } from '../db/schema/laporan-harian.js';
import { pengamatan } from '../db/schema/pengamatan.js';
import { authorizeApi } from '../middleware.js';
import { validasiLaporan } from '../db/schema/validasi-laporan.js';
import { containsObject } from '../helper.js';
import { validator as validatorSchema } from '../db/schema/validator.js';
import { user } from '../db/schema/user.js';
import { lokasi } from '../db/schema/lokasi.js';
import { provinsi } from '../db/schema/provinsi.js';
import { kabupatenKota } from '../db/schema/kabupaten-kota.js';
import { kecamatan } from '../db/schema/kecamatan.js';
import { desa } from '../db/schema/desa.js';

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
      laporan_harian: number[];
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
    const {
      lokasi_laporan_setengah_bulanan,
      luas_kerusakan,
      laporan_harian,
      ...rest
    } = c.req.valid('json');
    const [lat, long] = lokasi_laporan_setengah_bulanan.coordinates;

    try {
      var insertedData = await db
        .insert(laporanSbSchema)
        .values({ point_laporan_sb: [lat, long], ...rest })
        .returning();

      const insertLuasKerusakan = luas_kerusakan.map((value) => {
        return { ...value, laporan_sb_id: insertedData[0].id };
      });

      await db.insert(luasKerusakanSb).values(insertLuasKerusakan);

      await db
        .insert(validasiLaporan)
        .values({ laporan_sb_id: insertedData[0].id });

      await db
        .update(laporanHarian)
        .set({
          status_laporan_sb: true,
          id_laporan_sb: insertedData[0].id,
        })
        .where(inArray(laporanHarian.id, laporan_harian));
    } catch (error) {
      console.error(error);
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

  const userValidator = db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      validasi: user.validasi,
      usergroup_id: user.usergroup_id,
    })
    .from(user)
    .leftJoin(validatorSchema, eq(validatorSchema.user_id, user.id))
    .leftJoin(
      validasiLaporan,
      eq(validasiLaporan.id, validatorSchema.validasi_laporan_id)
    )
    .leftJoin(
      laporanSbSchema,
      eq(laporanSbSchema.id, validasiLaporan.laporan_sb_id)
    )
    .where(eq(laporanSbSchema.id, parseInt(laporanSbId)))
    .as('user_validator');

  try {
    var selectData = await db
      .select({
        laporan_sb: {
          ...laporanSbSchema,
          blok: pengamatan.blok,
        },
        laporan_harian: laporanHarian,
        validasi_laporan: validasiLaporan,
        luas_kerusakan_sb: luasKerusakanSb,
        validator: validatorSchema,
        user_validator: {
          id: userValidator.id,
          name: userValidator.name,
          email: userValidator.name,
          phone: userValidator.phone,
          photo: userValidator.photo,
          validasi: userValidator.validasi,
          usergroup_id: userValidator.usergroup_id,
        },
        lokasi: {
          ...lokasi,
          provinsi: {
            id: provinsi.id,
            nama_provinsi: provinsi.nama_provinsi,
          },
          kabupaten_kota: {
            id: kabupatenKota.id,
            nama_kabkot: kabupatenKota.nama_kabkot,
          },
          kecamatan: {
            id: kecamatan.id,
            nama_kecamatan: kecamatan.nama_kecamatan,
          },
          desa: {
            id: desa.id,
            nama_desa: desa.nama_desa,
          },
        },
      })
      .from(laporanSbSchema)
      .leftJoin(
        luasKerusakanSb,
        eq(luasKerusakanSb.laporan_sb_id, laporanSbSchema.id)
      )
      .leftJoin(
        validasiLaporan,
        eq(validasiLaporan.laporan_sb_id, laporanSbSchema.id)
      )
      .leftJoin(
        validatorSchema,
        eq(validatorSchema.validasi_laporan_id, validasiLaporan.id)
      )
      .leftJoin(userValidator, eq(userValidator.id, validatorSchema.user_id))
      .leftJoin(
        laporanHarian,
        eq(laporanHarian.id_laporan_sb, laporanSbSchema.id)
      )
      .leftJoin(pengamatan, eq(pengamatan.id, laporanHarian.pengamatan_id))
      .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
      .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
      .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
      .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
      .leftJoin(desa, eq(desa.id, lokasi.desa_id))
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

  const result = selectData.reduce((acc, row) => {
    const laporanSb = row.laporan_sb;
    const laporanHarian = row.laporan_harian;
    const validasiLaporan = row.validasi_laporan;
    const luasKerusakanSb = row.luas_kerusakan_sb;
    const lokasi = row.lokasi;
    const validator = !!row.validator
      ? {
          ...row.validator,
          ...(row.user_validator ? { user: row.user_validator } : {}),
        }
      : null;

    const finalRow = {
      ...laporanSb,
      lokasi,
      laporan_harian: [laporanHarian],
      validasi_laporan: {
        ...validasiLaporan,
        validator: !!validator ? [validator] : null,
      },
      luas_kerusakan: [luasKerusakanSb],
    };

    if (!acc[laporanSbId]) {
      acc[laporanSbId] = finalRow;
    } else {
      if (!containsObject(laporanHarian, acc[laporanSbId].laporan_harian)) {
        acc[laporanSbId].laporan_harian.push(laporanHarian);
      }

      if (
        !!validator &&
        !containsObject(validator, acc[laporanSbId].validasi_laporan.validator)
      ) {
        acc[laporanSbId].validasi_laporan.validator.push(validator);
      }

      if (!containsObject(luasKerusakanSb, acc[laporanSbId].luas_kerusakan)) {
        acc[laporanSbId].luas_kerusakan.push(luasKerusakanSb);
      }
    }

    return acc;
  }, {});

  return c.json({
    status: 200,
    message: 'success',
    data: result[laporanSbId],
  });
});
laporanSb.get('/laporan_sb', async (c) => {
  const {
    user_id,
    lokasi_id,
    start_date,
    end_date,
    page,
    per_page,
    kabkot_id,
    kecamatan_id,
    desa_id,
  } = c.req.query() as Record<
    | 'user_id'
    | 'lokasi_id'
    | 'start_date'
    | 'end_date'
    | 'page'
    | 'per_page'
    | 'kabkot_id'
    | 'kecamatan_id'
    | 'desa_id',
    string
  >;
  const foo = await db
    .select({
      id: laporanSbSchema.id,
    })
    .from(laporanSbSchema)
    .where(
      and(
        !!user_id ? eq(laporanSbSchema.pic_id, parseInt(user_id)) : undefined,
        !!start_date
          ? gte(laporanSbSchema.tanggal_laporan_sb, start_date)
          : undefined,
        !!end_date
          ? lte(laporanSbSchema.tanggal_laporan_sb, end_date)
          : undefined
      )
    )
    .orderBy(asc(laporanSbSchema.id))
    .limit(parseInt(per_page || '10'))
    .offset((parseInt(page || '1') - 1) * parseInt(per_page || '10'));

  if (foo.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'data tidak ditemukan',
      },
      404
    );
  }

  const userValidator = db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      validasi: user.validasi,
      usergroup_id: user.usergroup_id,
    })
    .from(user)
    .leftJoin(validatorSchema, eq(validatorSchema.user_id, user.id))
    .leftJoin(
      validasiLaporan,
      eq(validasiLaporan.id, validatorSchema.validasi_laporan_id)
    )
    .leftJoin(
      laporanSbSchema,
      eq(laporanSbSchema.id, validasiLaporan.laporan_sb_id)
    )
    .as('user_validator');

  const selectData = await db
    .select({
      laporan_sb: {
        ...laporanSbSchema,
        blok: pengamatan.blok,
      },
      validasi_laporan: validasiLaporan,
      validator: validatorSchema,
      user_validator: {
        id: userValidator.id,
        name: userValidator.name,
        email: userValidator.email,
        phone: userValidator.phone,
        photo: userValidator.photo,
        validasi: userValidator.validasi,
        usergroup_id: userValidator.usergroup_id,
      },
      laporan_harian: laporanHarian,
      luas_kerusakan_sb: luasKerusakanSb,
      lokasi: {
        ...lokasi,
        provinsi: {
          id: provinsi.id,
          nama_provinsi: provinsi.nama_provinsi,
        },
        kabupaten_kota: {
          id: kabupatenKota.id,
          nama_kabkot: kabupatenKota.nama_kabkot,
        },
        kecamatan: {
          id: kecamatan.id,
          nama_kecamatan: kecamatan.nama_kecamatan,
        },
        desa: {
          id: desa.id,
          nama_desa: desa.nama_desa,
        },
      },
    })
    .from(laporanSbSchema)
    .leftJoin(
      validasiLaporan,
      eq(validasiLaporan.laporan_sb_id, laporanSbSchema.id)
    )
    .leftJoin(
      validatorSchema,
      eq(validatorSchema.validasi_laporan_id, validasiLaporan.id)
    )
    .leftJoin(userValidator, eq(userValidator.id, validatorSchema.user_id))
    .leftJoin(
      laporanHarian,
      eq(laporanHarian.id_laporan_sb, laporanSbSchema.id)
    )
    .leftJoin(pengamatan, eq(pengamatan.id, laporanHarian.pengamatan_id))
    .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
    .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
    .leftJoin(desa, eq(desa.id, lokasi.desa_id))
    .leftJoin(
      luasKerusakanSb,
      eq(luasKerusakanSb.laporan_sb_id, laporanSbSchema.id)
    )
    .where(
      and(
        inArray(
          laporanSbSchema.id,
          foo.map((val) => val.id)
        ),
        !!lokasi_id ? eq(pengamatan.lokasi_id, lokasi_id) : undefined,
        !!kabkot_id ? eq(kabupatenKota.id, kabkot_id) : undefined,
        !!kecamatan_id ? eq(kecamatan.id, kecamatan_id) : undefined,
        !!desa_id ? eq(desa.id, desa_id) : undefined
      )
    )
    .orderBy(asc(laporanSbSchema.id));

  if (selectData.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'Laporan setengah bulan tidak ditemukan',
      },
      404
    );
  }

  const result = selectData.reduce((acc, row) => {
    const laporanSb = row.laporan_sb;
    const laporanHarian = row.laporan_harian;
    const luasKerusakanSb = row.luas_kerusakan_sb;
    const validasiLaporan = row.validasi_laporan;
    const lokasi = row.lokasi;
    const validator = !!row.validator
      ? {
          ...row.validator,
          ...(!!row.user_validator ? { user: row.user_validator } : null),
        }
      : null;

    const laporan = acc.find((value) => {
      return value.id === laporanSb.id;
    });
    const finalRow = {
      ...laporanSb,
      validasi_laporan: {
        ...validasiLaporan,
        validator: [validator],
      },
      lokasi,
      laporan_harian: [laporanHarian],
      luas_kerusakan: [luasKerusakanSb],
    };

    if (!laporan) {
      acc.push(finalRow);
    } else {
      if (
        !!laporanHarian &&
        !containsObject(laporanHarian, acc[acc.indexOf(laporan)].laporan_harian)
      ) {
        acc[acc.indexOf(laporan)].laporan_harian.push(laporanHarian);
      }

      if (
        !!luasKerusakanSb &&
        !containsObject(
          luasKerusakanSb,
          acc[acc.indexOf(laporan)].luas_kerusakan
        )
      ) {
        acc[acc.indexOf(laporan)].luas_kerusakan.push(luasKerusakanSb);
      }

      if (
        !!validator &&
        !containsObject(
          validator,
          acc[acc.indexOf(laporan)].validasi_laporan.validator
        )
      ) {
        acc[acc.indexOf(laporan)].validasi_laporan.validator.push(validator);
      }
    }

    return acc;
  }, []);

  return c.json({
    status: 200,
    message: 'success',
    data: result,
  });
});
