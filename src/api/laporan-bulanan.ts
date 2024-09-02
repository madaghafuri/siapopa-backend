import { Hono } from 'hono';
import { validator } from 'hono/validator';
import {
  InsertLaporanBulanan,
  laporanBulanan as laporanBulananSchema,
} from '../db/schema/laporan-bulanan.js';
import { db } from '../index.js';
import { and, asc, eq, gte, inArray, lte, sql, SQL } from 'drizzle-orm';
import { laporanSb } from '../db/schema/laporan-sb.js';
import { user } from '../db/schema/user';
import { lokasi } from '../db/schema/lokasi';
import { authorizeApi } from '../middleware';
import { validasiLaporan } from '../db/schema/validasi-laporan.js';
import { validator as validatorSchema } from '../db/schema/validator.js';
import { laporanHarian } from '../db/schema/laporan-harian.js';
import { pengamatan } from '../db/schema/pengamatan.js';
import { containsObject } from '../helper.js';
import { provinsi } from '../db/schema/provinsi.js';
import { kabupatenKota } from '../db/schema/kabupaten-kota.js';
import { kecamatan } from '../db/schema/kecamatan.js';
import { desa } from '../db/schema/desa.js';

export const laporanBulanan = new Hono();

laporanBulanan.use('/laporan_bulanan/*', authorizeApi);

laporanBulanan.post(
  '/laporan_bulanan',
  validator('json', (value, c) => {
    const { opt_id, pic_id, lokasi_id, ...rest } =
      value as InsertLaporanBulanan & {
        lokasi_laporan_bulanan: { type: string; coordinates: [number, number] };
        lokasi_id: string;
        laporan_sb: number[];
      };

    if (!opt_id || !lokasi_id || !pic_id) {
      return c.json(
        {
          status: 401,
          message: 'missing required data',
        },
        401
      );
    }

    return { opt_id, pic_id, lokasi_id, ...rest };
  }),
  async (c) => {
    const { lokasi_laporan_bulanan, lokasi_id, laporan_sb, ...rest } =
      c.req.valid('json');
    const [lat, long] = lokasi_laporan_bulanan.coordinates;

    try {
      var insertLaporan = await db
        .insert(laporanBulananSchema)
        .values({ ...rest, point: [lat, long] })
        .returning();

      await db
        .insert(validasiLaporan)
        .values({ laporan_bulanan_id: insertLaporan[0].id });

      await db
        .update(laporanSb)
        .set({
          status_laporan_bulanan: true,
          laporan_bulanan_id: insertLaporan[0].id,
        })
        .where(inArray(laporanSb.id, laporan_sb));
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
      data: insertLaporan[0],
    });
  }
);
laporanBulanan.put(
  '/laporan_bulanan/:laporanBulananId',
  validator('json', (value) => {
    const data = value as InsertLaporanBulanan & {
      lokasi_id: string;
      lokasi_laporan_bulanan: {
        type: string;
        coordinates: [number, number];
      };
    };

    return data;
  }),
  async (c) => {
    const { lokasi_laporan_bulanan, ...rest } = c.req.valid('json');
    const laporanBulananId = c.req.param('laporanBulananId');
    const [lat, long] = lokasi_laporan_bulanan.coordinates;

    try {
      var updatedData = await db
        .update(laporanBulananSchema)
        .set({ ...rest, point: [lat, long] })
        .where(eq(laporanBulananSchema.id, parseInt(laporanBulananId)))
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
      data: updatedData[0],
    });
  }
);
laporanBulanan.delete('/laporan_bulanan/:laporanBulananId', async (c) => {
  const laporanBulananId = c.req.param('laporanBulananId');

  try {
    await db
      .delete(laporanBulananSchema)
      .where(eq(laporanBulananSchema.id, parseInt(laporanBulananId)));
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
    message: 'Berhasil menghapus laporan bulanan',
  });
});
laporanBulanan.get('/laporan_bulanan/:laporanBulananId', async (c) => {
  const laporanBulananId = c.req.param('laporanBulananId');

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
      laporanBulananSchema,
      eq(laporanBulananSchema.id, validasiLaporan.laporan_bulanan_id)
    )
    .where(eq(laporanBulananSchema.id, parseInt(laporanBulananId)))
    .as('user_validator');

  const selectDataLaporan = await db
    .select({
      laporan_bulanan: {
        ...laporanBulananSchema,
        blok: pengamatan.blok,
      },
      validasi_laporan: validasiLaporan,
      laporan_sb: laporanSb,
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
    .from(laporanBulananSchema)
    .leftJoin(
      validasiLaporan,
      eq(validasiLaporan.laporan_bulanan_id, laporanBulananSchema.id)
    )
    .leftJoin(
      validatorSchema,
      eq(validatorSchema.validasi_laporan_id, validasiLaporan.id)
    )
    .leftJoin(userValidator, eq(userValidator.id, validatorSchema.user_id))
    .leftJoin(
      laporanSb,
      eq(laporanSb.laporan_bulanan_id, laporanBulananSchema.id)
    )
    .leftJoin(laporanHarian, eq(laporanHarian.id_laporan_sb, laporanSb.id))
    .leftJoin(pengamatan, eq(pengamatan.id, laporanHarian.pengamatan_id))
    .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
    .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
    .leftJoin(desa, eq(desa.id, lokasi.desa_id))
    .where(eq(laporanBulananSchema.id, parseInt(laporanBulananId)));

  const result = selectDataLaporan.reduce((acc, row) => {
    const laporanBulanan = row.laporan_bulanan;
    const laporanSb = row.laporan_sb;
    const validasiLaporan = row.validasi_laporan;
    const lokasi = row.lokasi;
    const validator = !!row.validator
      ? {
          ...row.validator,
          ...(!!row.user_validator ? { user: row.user_validator } : null),
        }
      : null;

    const finalRow = {
      ...laporanBulanan,
      validasi_laporan: {
        ...validasiLaporan,
        validator: validator,
      },
      lokasi,
      laporan_sb: [laporanSb],
    };

    if (!acc[laporanBulananId]) {
      acc[laporanBulananId] = finalRow;
    } else {
      if (!containsObject(laporanSb, acc[laporanBulananId].laporan_sb)) {
        acc[laporanBulananId].laporan_sb.push(laporanSb);
      }

      if (
        !!validator &&
        !containsObject(
          validator,
          acc[laporanBulananId].validasi_laporan.validator
        )
      ) {
        acc[laporanBulananId].validasi_laporan.validator.push(validator);
      }
    }

    return acc;
  }, {});

  return c.json({
    status: 200,
    message: 'success',
    data: result[laporanBulananId],
  });
});
laporanBulanan.get('/laporan_bulanan', async (c) => {
  const {
    page,
    per_page,
    user_id,
    lokasi_id,
    start_date,
    end_date,
    kabkot_id,
    kecamatan_id,
    desa_id,
  } = c.req.query();

  const validLaporanBulanan = await db
    .select()
    .from(laporanBulananSchema)
    .where(
      and(
        !!user_id
          ? eq(laporanBulananSchema.pic_id, parseInt(user_id))
          : undefined,
        !!start_date
          ? gte(laporanBulananSchema.tanggal_laporan_bulanan, start_date)
          : undefined,
        !!end_date
          ? lte(laporanBulananSchema.tanggal_laporan_bulanan, end_date)
          : undefined
      )
    )
    .orderBy(asc(laporanBulananSchema.id))
    .limit(parseInt(per_page || '10'))
    .offset((parseInt(page || '1') - 1) * parseInt(per_page || '10'));

  if (validLaporanBulanan.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'Data laporan tidak ditemukan',
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
      laporanBulananSchema,
      eq(laporanBulananSchema.id, validasiLaporan.laporan_bulanan_id)
    )
    .as('user_validator');

  const selectDataLaporan = await db
    .select({
      laporan_bulanan: {
        ...laporanBulananSchema,
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
      laporan_sb: laporanSb,
      lokasi: lokasi,
    })
    .from(laporanBulananSchema)
    .leftJoin(
      validasiLaporan,
      eq(validasiLaporan.laporan_bulanan_id, laporanBulananSchema.id)
    )
    .leftJoin(
      validatorSchema,
      eq(validatorSchema.validasi_laporan_id, validasiLaporan.id)
    )
    .leftJoin(userValidator, eq(userValidator.id, validatorSchema.user_id))
    .leftJoin(
      laporanSb,
      eq(laporanSb.laporan_bulanan_id, laporanBulananSchema.id)
    )
    .leftJoin(laporanHarian, eq(laporanHarian.id_laporan_sb, laporanSb.id))
    .leftJoin(pengamatan, eq(pengamatan.id, laporanHarian.pengamatan_id))
    .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
    .where(
      and(
        inArray(
          laporanBulananSchema.id,
          validLaporanBulanan.map((val) => val.id)
        ),
        !!lokasi_id ? eq(pengamatan.lokasi_id, lokasi_id) : undefined,
        !!kabkot_id ? eq(lokasi.kabkot_id, kabkot_id) : undefined,
        !!kecamatan_id ? eq(lokasi.kecamatan_id, kecamatan_id) : undefined,
        !!desa_id ? eq(lokasi.desa_id, desa_id) : undefined
      )
    )
    .orderBy(asc(laporanBulananSchema.id));

  if (selectDataLaporan.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'Data laporan tidak ditemukan',
      },
      404
    );
  }

  const result = selectDataLaporan.reduce((acc, row) => {
    const laporanBulanan = row.laporan_bulanan;
    const laporanSb = row.laporan_sb;
    const validasiLaporan = row.validasi_laporan;
    const validator = !!row.validator
      ? {
          ...row.validator,
          ...(!!row.user_validator ? { user: row.user_validator } : null),
        }
      : null;
    const lokasi = row.lokasi;

    const laporan = acc.find((value) => {
      return value.id === laporanBulanan.id;
    });
    const finalRow = {
      ...laporanBulanan,
      validasi_laporan: {
        ...validasiLaporan,
        validator: [validator],
      },
      lokasi,
      laporan_sb: [laporanSb],
    };

    if (!laporan) {
      acc.push(finalRow);
    } else {
      if (
        !!laporanSb &&
        !containsObject(laporanSb, acc[acc.indexOf(laporan)].laporan_sb)
      ) {
        acc[acc.indexOf(laporan)].laporan_sb.push(laporanSb);
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
