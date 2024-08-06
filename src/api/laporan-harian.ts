import { Hono } from 'hono';
import { validator } from 'hono/validator';
import {
  InsertLaporanHarian,
  LaporanHarian,
  laporanHarian as laporanHarianSchema,
} from '../db/schema/laporan-harian.js';
import { db } from '../index.js';
import { and, asc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { Lokasi, lokasi } from '../db/schema/lokasi';
import { Pengamatan, pengamatan } from '../db/schema/pengamatan';
import { rumpun } from '../db/schema/rumpun';
import { detailRumpun } from '../db/schema/detail-rumpun';
import { hasilPengamatan, withPagination } from './helper';
import { authorizeApi } from '../middleware';
import { opt } from '../db/schema/opt';
import { tanaman } from '../db/schema/tanaman';
import { provinsi } from '../db/schema/provinsi';
import { kabupatenKota } from '../db/schema/kabupaten-kota';
import { kecamatan } from '../db/schema/kecamatan';
import { desa } from '../db/schema/desa';
import { SelectUser, user } from '../db/schema/user';
import {
  SelectValidasiLaporan,
  validasiLaporan,
} from '../db/schema/validasi-laporan.js';
import {
  SelectValidator,
  validator as validatorSchema,
} from '../db/schema/validator.js';
import { containsObject } from '../helper.js';

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

      await db.insert(validasiLaporan).values({
        laporan_harian_id: insertedData[0].id,
      });
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

  const userValidator = db
    .select({
      id: user.id,
      name: user.name,
      phone: user.phone,
      photo: user.photo,
      email: user.email,
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
      laporanHarianSchema,
      eq(laporanHarianSchema.id, validasiLaporan.laporan_harian_id)
    )
    .where(eq(laporanHarianSchema.id, parseInt(laporanHarianId)))
    .as('user_validator');

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
      pic: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        photo: user.photo,
        validasi: user.validasi,
        usergroup_id: user.usergroup_id,
      },
      validasi_laporan: validasiLaporan,
      validator: validatorSchema,
      user_validator: {
        id: userValidator.id,
        email: userValidator.email,
        name: userValidator.name,
        phone: userValidator.phone,
        photo: userValidator.photo,
        validasi: userValidator.validasi,
        usergroup_id: userValidator.usergroup_id,
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
    .leftJoin(
      validasiLaporan,
      eq(validasiLaporan.laporan_harian_id, laporanHarianSchema.id)
    )
    .leftJoin(
      validatorSchema,
      eq(validatorSchema.validasi_laporan_id, validasiLaporan.id)
    )
    .leftJoin(userValidator, eq(userValidator.id, validatorSchema.user_id))
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

  const res = laporanHarianQuery.reduce<
    Record<
      number,
      LaporanHarian & {
        pengamatan: Pengamatan;
        lokasi: Lokasi;
        pic: Omit<SelectUser, 'password'>;
        validasi_laporan?: SelectValidasiLaporan & {
          validator: (SelectValidator & {
            user: Omit<SelectUser, 'password'>;
          })[];
        };
        hasil_pengamatan: {
          id_opt: number;
          kode_opt: string;
          hasil_perhitungan: string;
          skala: 'mutlak' | 'tidak mutlak' | 'ekor/rumpun' | 'ekor/m2' | 'ma';
        }[];
      }
    >
  >((acc, row) => {
    const totalAnakan = row.total_anakan;
    const totalOpt = row.total_opt;
    const laporanHarian = row.laporan_harian;
    const pengamatan = row.pengamatan;
    const lokasi = row.lokasi;
    const pic = row.pic;
    const validasiLaporan = row.validasi_laporan;
    const validator = {
      ...row.validator,
      user: row.user_validator,
    };
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
        validasi_laporan: { ...validasiLaporan, validator: [validator] },
        hasil_pengamatan: [hasilPerhitungan],
      };
    } else if (acc[laporanHarian.id]) {
      if (
        !containsObject(
          validator,
          acc[laporanHarian.id].validasi_laporan.validator
        )
      ) {
        acc[laporanHarian.id].validasi_laporan.validator.push(validator);
      }

      if (
        !containsObject(
          hasilPerhitungan,
          acc[laporanHarian.id].hasil_pengamatan
        )
      ) {
        acc[laporanHarian.id].hasil_pengamatan.push(hasilPerhitungan);
      }
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

    const validLaporanHarian = await db
      .select()
      .from(laporanHarianSchema)
      .where(
        and(
          !!user_id
            ? eq(laporanHarianSchema.pic_id, parseInt(user_id))
            : undefined,
          !!start_date
            ? gte(laporanHarianSchema.tanggal_laporan_harian, start_date)
            : undefined,
          !!end_date
            ? lte(laporanHarianSchema.tanggal_laporan_harian, end_date)
            : undefined
        )
      )
      .limit(parseInt(per_page || '10'))
      .offset((parseInt(page || '1') - 1) * parseInt(per_page || '10'));

    if (validLaporanHarian.length === 0) {
      return c.json(
        {
          status: 404,
          message: 'laporan harian tidak ditemukan',
        },
        404
      );
    }

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

    const userValidator = db
      .select({
        id: user.id,
        name: user.name,
        phone: user.phone,
        photo: user.photo,
        email: user.email,
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
        laporanHarianSchema,
        eq(laporanHarianSchema.id, validasiLaporan.laporan_harian_id)
      )
      .as('user_validator');

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
            nama_kecamatan: kecamatan.id,
          },
          desa: {
            id: desa.id,
            nama_desa: desa.nama_desa,
          },
        },
        validasi_laporan: validasiLaporan,
        validator: validatorSchema,
        user_validator: {
          id: userValidator.id,
          email: userValidator.email,
          name: userValidator.name,
          phone: userValidator.phone,
          photo: userValidator.photo,
          validasi: userValidator.validasi,
          usergroup_id: userValidator.usergroup_id,
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
      .leftJoin(
        validasiLaporan,
        eq(validasiLaporan.laporan_harian_id, laporanHarianSchema.id)
      )
      .leftJoin(
        validatorSchema,
        eq(validatorSchema.validasi_laporan_id, validasiLaporan.id)
      )
      .leftJoin(userValidator, eq(userValidator.id, validatorSchema.user_id))
      .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
      .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
      .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
      .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
      .leftJoin(desa, eq(desa.id, lokasi.desa_id))
      .where(
        and(
          !!location_id ? eq(lokasi.id, location_id) : undefined,
          inArray(
            laporanHarianSchema.id,
            validLaporanHarian.map((val) => val.id)
          )
        )
      )
      .orderBy(asc(laporanHarianSchema.id));

    try {
      var selectData = await query;
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
      const validasiLaporan = row.validasi_laporan;
      const validator = !!row.validator
        ? {
            ...row.validator,
            user: row.user_validator,
          }
        : null;

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
        validasi_laporan: {
          ...validasiLaporan,
          validator: !!validator ? [validator] : null,
        },
        hasil_pengamatan: [hasil],
      };

      const laporan = acc.find(
        (value) => value.laporan_harian.id === laporanHarian.id
      );

      if (!laporan) {
        acc.push(finalRow);
      } else if (!!laporan) {
        if (
          !containsObject(hasil, acc[acc.indexOf(laporan)].hasil_pengamatan)
        ) {
          acc[acc.indexOf(laporan)].hasil_pengamatan.push(hasil);
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
  }
);
laporanHarian.get('list/laporan_harian', async (c) => {
  const { pic_id, lokasi_id, start_date, end_date, page, per_page } =
    c.req.query();

  const selectData = await db
    .select({
      blok: pengamatan.blok,
      laporan_harian_id:
        sql`string_agg(${laporanHarianSchema.id}::text, ', ')`.as('list_id'),
    })
    .from(laporanHarianSchema)
    .leftJoin(pengamatan, eq(pengamatan.id, laporanHarianSchema.pengamatan_id))
    .where(
      and(
        !!pic_id ? eq(laporanHarianSchema.pic_id, parseInt(pic_id)) : undefined,
        !!lokasi_id ? eq(pengamatan.lokasi_id, lokasi_id) : undefined,
        !!start_date
          ? gte(laporanHarianSchema.tanggal_laporan_harian, start_date)
          : undefined,
        !!end_date
          ? lte(laporanHarianSchema.tanggal_laporan_harian, end_date)
          : undefined
      )
    )
    .groupBy(pengamatan.blok)
    .limit(parseInt(per_page || '10'))
    .offset((parseInt(page || '1') - 1) * parseInt(per_page || '10'));

  if (selectData.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'data tidak ditemukan',
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
