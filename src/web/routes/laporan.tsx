import { Hono } from 'hono';
import { DefaultLayout } from '../layouts/default-layout.js';
import { Session } from 'hono-sessions';
import { db } from '../../index.js';
import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { SelectUser, user } from '../../db/schema/user.js';
import Profile from '../components/profile.js';
import LaporanHarianPage, {
  columnHeaders,
  DataLaporanHarian,
} from '../pages/laporan/laporan-harian.js';
import { Lokasi, lokasi } from '../../db/schema/lokasi.js';
import {
  LaporanHarian,
  laporanHarian as laporanHarianSchema,
} from '../../db/schema/laporan-harian.js';
import { Pengamatan, pengamatan } from '../../db/schema/pengamatan.js';
import { Provinsi, provinsi } from '../../db/schema/provinsi.js';
import {
  KabupatenKota,
  kabupatenKota,
} from '../../db/schema/kabupaten-kota.js';
import { Kecamatan, kecamatan } from '../../db/schema/kecamatan.js';
import { Desa, desa } from '../../db/schema/desa.js';
import { validator } from 'hono/validator';
import { SelectTanaman, tanaman } from '../../db/schema/tanaman.js';
import { Fragment } from 'hono/jsx/jsx-runtime';
import {
  PengamatanDetailPage,
  PengamatanPage,
  pengamatanColumn,
} from '../pages/laporan/pengamatan.js';
import { rumpun } from '../../db/schema/rumpun.js';
import { detailRumpun, Kerusakan } from '../../db/schema/detail-rumpun.js';
import { opt } from '../../db/schema/opt.js';
import { hasilPengamatan } from '../../api/helper.js';
import { userGroup } from '../../db/schema/user-group.js';
import { LaporanSb, laporanSb } from '../../db/schema/laporan-sb.js';
import {
  columnLaporanSb,
  LaporanSbDetailPage,
  LaporanSbPage,
} from '../pages/laporan/laporan-sb.js';
import { LaporanBulananPage } from '../pages/laporan/laporan-bulanan.js';
import { laporanBulanan } from '../../db/schema/laporan-bulanan.js';
import { laporanMusiman } from '../../db/schema/laporan-musiman.js';
import { LaporanMusimanPage } from '../pages/laporan/laporan-musiman.js';
import { luasKerusakanSb } from '../../db/schema/luas-kerusakan-sb.js';

export const laporan = new Hono<{
  Variables: {
    session: Session;
    session_rotation_key: boolean;
  };
}>();

const laporanHarian = laporan.route('/harian');

laporanHarian.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  const tanamanId = c.req.query('tanaman_id');
  const provinsiId = c.req.query('provinsi_id');

  const selectedUser = await db.query.user
    .findFirst({
      where: eq(user.id, parseInt(userId)),
      with: {
        userGroup: true,
      },
    })
    .catch((err) => {
      console.error(err);
    });

  const listLaporan = await db
    .select({
      laporan_harian: laporanHarianSchema,
      pengamatan,
      lokasi: {
        ...lokasi,
        provinsi,
        kabupaten_kota: kabupatenKota,
        kecamatan,
        desa,
      },
    })
    .from(laporanHarianSchema)
    .leftJoin(pengamatan, eq(pengamatan.id, laporanHarianSchema.pengamatan_id))
    .leftJoin(tanaman, eq(tanaman.id, pengamatan.tanaman_id))
    .leftJoin(user, eq(user.id, laporanHarianSchema.pic_id))
    .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
    .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
    .leftJoin(desa, eq(desa.id, lokasi.desa_id))
    .where(
      and(
        !!tanamanId ? eq(tanaman.id, parseInt(tanamanId)) : undefined,
        !!provinsiId ? eq(provinsi.id, provinsiId) : undefined,
        !!startDate
          ? gte(laporanHarianSchema.tanggal_laporan_harian, startDate)
          : undefined,
        !!endDate
          ? lte(laporanHarianSchema.tanggal_laporan_harian, endDate)
          : undefined
      )
    )
    .orderBy(laporanHarianSchema.id)
    .limit(25)
    .offset(0);

  const tanamanList = await db.query.tanaman.findMany({
    orderBy: tanaman.id,
  });

  const provinsiList = await db.query.provinsi.findMany({
    orderBy: provinsi.nama_provinsi,
  });

  const result: DataLaporanHarian[] = listLaporan.map((value) => {
    const laporan = value.laporan_harian as LaporanHarian;
    const pengamatan = value.pengamatan as Pengamatan;
    const lokasi = value.lokasi as Lokasi & {
      provinsi: Provinsi;
      kabupaten_kota: KabupatenKota;
      kecamatan: Kecamatan;
      desa: Desa;
    };

    return {
      ...laporan,
      pengamatan,
      lokasi,
    };
  });

  return c.html(
    <DefaultLayout
      route="laporan-harian"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <LaporanHarianPage
        listLaporan={result}
        komoditasOption={tanamanList}
        provinsiOption={provinsiList}
      />
    </DefaultLayout>
  );
});
type FilterLaporanQuery = {
  tanaman_id: string;
  provinsi_id: string;
  start_date: string;
  end_date: string;
};
laporanHarian.get(
  '/filter',
  validator('query', (value) => {
    return value;
  }),
  async (c) => {
    const { tanaman_id, provinsi_id, start_date, end_date } =
      c.req.query() as Record<keyof FilterLaporanQuery, string>;

    const bar = await db
      .select({
        laporan_harian: laporanHarianSchema,
        pengamatan,
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
        pengamatan,
        eq(pengamatan.id, laporanHarianSchema.pengamatan_id)
      )
      .leftJoin(tanaman, eq(tanaman.id, pengamatan.tanaman_id))
      .leftJoin(user, eq(user.id, laporanHarianSchema.pic_id))
      .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
      .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
      .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
      .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
      .leftJoin(desa, eq(desa.id, lokasi.desa_id))
      .where(
        and(
          !!tanaman_id ? eq(tanaman.id, parseInt(tanaman_id)) : undefined,
          !!provinsi_id ? eq(provinsi.id, provinsi_id) : undefined,
          !!start_date
            ? gte(laporanHarianSchema.tanggal_laporan_harian, start_date)
            : undefined,
          !!end_date
            ? lte(laporanHarianSchema.tanggal_laporan_harian, end_date)
            : undefined
        )
      )
      .orderBy(laporanHarianSchema.id)
      .limit(25)
      .offset(0);

    const result = bar.map((value) => {
      const laporan = value.laporan_harian;
      const pengamatan = value.pengamatan;
      const lokasi = value.lokasi;

      return {
        ...laporan,
        pengamatan,
        lokasi,
      };
    });
    const newUrl = new URLSearchParams();
    !!start_date && newUrl.append('start_date', start_date);
    !!end_date && newUrl.append('end_date', end_date);
    !!tanaman_id && newUrl.append('tanaman_id', tanaman_id);
    !!provinsi_id && newUrl.append('provinsi_id', provinsi_id);

    return c.html(
      <Fragment>
        {result.map((row, index) => {
          return (
            <tr key={row.id}>
              {columnHeaders.map((column) => {
                return (
                  <td class="bordery-gray-200 border-b px-4 py-2 text-right">
                    {column?.valueGetter?.(row, index) || row[column.field]}
                  </td>
                );
              })}
            </tr>
          );
        }) || null}
      </Fragment>,
      200,
      {
        'HX-Replace-Url': `/app/laporan/harian?` + newUrl.toString(),
      }
    );
  }
);

const pengamatanRoute = laporan.route('/pengamatan');

pengamatanRoute.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const selectedUser = await db.query.user
    .findFirst({
      with: {
        userGroup: true,
      },
      columns: {
        password: false,
      },
      where: eq(user.id, parseInt(userId)),
    })
    .catch((err) => {
      console.error(err);
    });

  const pengamatanList = await db.query.pengamatan.findMany({
    with: {
      tanaman: true,
      locations: {
        with: {
          provinsi: true,
        },
      },
      pic: true,
    },
    orderBy: pengamatan.id,
  });

  const tanamanList = await db.query.tanaman.findMany({
    orderBy: (tanaman, { asc }) => asc(tanaman.id),
  });
  const provinsiList = await db.query.provinsi.findMany({
    orderBy: (provinsi, { asc }) => asc(provinsi.id),
  });

  return c.html(
    <DefaultLayout
      route="pengamatan"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <PengamatanPage
        pengamatanList={pengamatanList}
        komoditasOption={tanamanList}
        provinsiOption={provinsiList}
      />
    </DefaultLayout>
  );
});
pengamatanRoute.get('/filter', async (c) => {
  const provinsiIds = c.req.queries('provinsi_id[]');
  const foo = c.req.queries('tanaman_id[]');
  const tanamanIds = !!foo ? foo.map((val) => parseInt(val)) : [];
  const { start_date, end_date } = c.req.query();

  const bar = { ...pengamatan.$inferSelect };
  console.log(bar);

  const pengamatanList = await db
    .select({
      id: pengamatan.id,
      tanaman_id: pengamatan.tanaman_id,
      lokasi_id: pengamatan.lokasi_id,
      hari_ke: pengamatan.hari_ke,
      blok: pengamatan.blok,
      luas_hamparan: pengamatan.luas_hamparan,
      luas_diamati: pengamatan.luas_diamati,
      luas_hasil_panen: pengamatan.luas_hasil_panen,
      luas_persemaian: pengamatan.luas_persemaian,
      ph_tanah: pengamatan.ph_tanah,
      komoditas: pengamatan.komoditas,
      varietas: pengamatan.varietas,
      dari_umur: pengamatan.dari_umur,
      hingga_umur: pengamatan.hingga_umur,
      pola_tanama: pengamatan.pola_tanam,
      pic_id: pengamatan.pic_id,
      sign_pic: pengamatan.sign_pic,
      tanggal_pengamatan: pengamatan.tanggal_pengamatan,
      point_pengamatan: pengamatan.point_pengamatan,
      status_laporan_harian: pengamatan.status_laporan_harian,
      locations: {
        ...lokasi,
        provinsi,
      },
      tanaman,
    })
    .from(pengamatan)
    .leftJoin(tanaman, eq(tanaman.id, pengamatan.tanaman_id))
    .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .where(
      and(
        !!provinsiIds && provinsiIds.length > 0
          ? inArray(provinsi.id, provinsiIds)
          : undefined,
        !!tanamanIds && tanamanIds.length > 0
          ? inArray(tanaman.id, tanamanIds)
          : undefined,
        !!start_date
          ? gte(pengamatan.tanggal_pengamatan, start_date)
          : undefined,
        !!end_date ? lte(pengamatan.tanggal_pengamatan, end_date) : undefined
      )
    );

  const newUrl = new URLSearchParams();
  !!start_date && newUrl.append('start_date', start_date);
  !!end_date && newUrl.append('end_date', end_date);
  !!provinsiIds &&
    provinsiIds.length > 0 &&
    provinsiIds.forEach((val) => newUrl.append('provinsi_id[]', val));
  !!tanamanIds &&
    tanamanIds.length > 0 &&
    tanamanIds.forEach((val) => newUrl.append('tanaman_id[]', val.toString()));

  return c.html(
    <Fragment>
      {pengamatanList.map((val, index) => {
        return (
          <tr key={val.id}>
            {pengamatanColumn.map((col) => {
              return (
                <td>{col?.valueGetter?.(val, index) || val[col.field]}</td>
              );
            })}
          </tr>
        );
      })}
    </Fragment>,
    200,
    { 'HX-Replace-Url': '/app/laporan/pengamatan?' + newUrl.toString() }
  );
});
pengamatanRoute.get('/:pengamatanId', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;
  const pengamatanId = c.req.param('pengamatanId');

  const selectedUser = await db.query.user
    .findFirst({
      with: {
        userGroup: true,
      },
      columns: {
        password: false,
      },
      where: eq(user.id, parseInt(userId)),
    })
    .catch((err) => {
      console.error(err);
    });

  const totalAnakan = db.$with('total_anakan').as(
    db
      .select({
        pengamatan_id: rumpun.pengamatan_id,
        total_anakan: sql<number>`sum(${rumpun.jumlah_anakan})`.as(
          'total_jumlah_anakan'
        ),
      })
      .from(rumpun)
      .where(eq(rumpun.pengamatan_id, parseInt(pengamatanId)))
      .groupBy(rumpun.pengamatan_id)
  );

  const totalOpt = db.$with('total_opt').as(
    db
      .select({
        pengamatan_id: rumpun.pengamatan_id,
        skala_kerusakan: detailRumpun.skala_kerusakan,
        opt_id: detailRumpun.opt_id,
        kode_opt: opt.kode_opt,
        total_opt: sql<number>`sum(${detailRumpun.jumlah_opt})`.as(
          'total_jumlah_opt'
        ),
      })
      .from(detailRumpun)
      .leftJoin(rumpun, eq(rumpun.id, detailRumpun.rumpun_id))
      .leftJoin(opt, eq(opt.id, detailRumpun.opt_id))
      .where(eq(rumpun.pengamatan_id, parseInt(pengamatanId)))
      .groupBy(
        detailRumpun.opt_id,
        detailRumpun.skala_kerusakan,
        rumpun.pengamatan_id,
        opt.kode_opt
      )
  );

  const pengamatanQuery = await db
    .with(totalOpt, totalAnakan)
    .select({
      pengamatan,
      total_anakan: {
        pengamatan_id: totalAnakan.pengamatan_id,
        total_anakan: totalAnakan.total_anakan,
      },
      total_opt: {
        pengamatan_id: totalOpt.pengamatan_id,
        opt_id: totalOpt.opt_id,
        kode_opt: totalOpt.kode_opt,
        skala_kerusakan: totalOpt.skala_kerusakan,
        total_opt: totalOpt.total_opt,
      },
      tanaman,
      pic: {
        ...user,
        user_group: userGroup,
      },
      lokasi: {
        ...lokasi,
        provinsi,
        kabupaten_kota: kabupatenKota,
        kecamatan,
        desa,
      },
    })
    .from(pengamatan)
    .leftJoin(totalOpt, eq(totalOpt.pengamatan_id, pengamatan.id))
    .leftJoin(totalAnakan, eq(totalAnakan.pengamatan_id, pengamatan.id))
    .leftJoin(tanaman, eq(tanaman.id, pengamatan.tanaman_id))
    .leftJoin(user, eq(user.id, pengamatan.pic_id))
    .leftJoin(userGroup, eq(userGroup.id, user.usergroup_id))
    .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
    .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
    .leftJoin(desa, eq(desa.id, lokasi.desa_id))
    .where(eq(pengamatan.id, parseInt(pengamatanId)));

  const result = pengamatanQuery.reduce<
    Record<
      string,
      {
        pengamatan: Pengamatan;
        lokasi: Lokasi & {
          provinsi: Provinsi;
          kabupaten_kota: KabupatenKota;
          kecamatan: Kecamatan;
          desa: Desa;
        };
        tanaman: SelectTanaman;
        pic: SelectUser;
        hasil_pengamatan: {
          opt_id: number;
          kode_opt: string;
          skala: Kerusakan;
          hasil_perhitungan: string;
        }[];
      }
    >
  >((acc, row) => {
    const pengamatan = row.pengamatan;
    const tanaman = row.tanaman;
    const lokasi = row.lokasi;
    const pic = row.pic;

    const hasilPerhitungan = hasilPengamatan(
      row.total_opt.skala_kerusakan,
      row.total_opt.total_opt,
      row.total_anakan.total_anakan
    );

    const hasil = {
      opt_id: row.total_opt.opt_id,
      kode_opt: row.total_opt.kode_opt,
      skala: row.total_opt.skala_kerusakan,
      hasil_perhitungan: hasilPerhitungan,
    };

    if (!acc[pengamatan.id]) {
      acc[pengamatan.id] = {
        pengamatan,
        lokasi: lokasi as Lokasi & {
          provinsi: Provinsi;
          kabupaten_kota: KabupatenKota;
          kecamatan: Kecamatan;
          desa: Desa;
        },
        tanaman,
        pic,
        hasil_pengamatan: [hasil],
      };
    } else if (acc[pengamatan.id]) {
      acc[pengamatan.id].hasil_pengamatan.push(hasil);
    }

    return acc;
  }, {});

  const rumpunList = await db.query.rumpun.findMany({
    where: eq(rumpun.pengamatan_id, parseInt(pengamatanId)),
    orderBy: rumpun.id,
  });

  return c.html(
    <DefaultLayout
      route="pengamatan-detail"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <PengamatanDetailPage
        pengamatan={result[pengamatanId]}
        rumpunData={rumpunList}
      />
    </DefaultLayout>
  );
});

const laporanSbRoute = laporan.route('/sb');

laporanSbRoute.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  const tanamanId = c.req.query('tanaman_id');
  const provinsiId = c.req.query('provinsi_id');

  const selectedUser = await db.query.user
    .findFirst({
      where: eq(user.id, parseInt(userId)),
      with: {
        userGroup: true,
      },
    })
    .catch((err) => {
      console.error(err);
    });

  // const laporanSbData = await db.query.laporanSb.findMany({
  //   with: {
  //     laporanHarian: true,
  //   },
  //   limit: 10,
  //   offset: 0,
  //   where: and(
  //     !!startDate ? gte(laporanSb.tanggal_laporan_sb, startDate) : undefined,
  //     !!endDate ? lte(laporanSb.tanggal_laporan_sb, endDate) : undefined,
  //     !!provinsiId ? eq(provinsi.id, provinsiId) : undefined,
  //     !!tanamanId ? eq(tanaman.id, parseInt(tanamanId)) : undefined
  //   ),
  // });

  const laporanSbData = await db
    .select()
    .from(laporanSb)
    .leftJoin(
      laporanHarianSchema,
      eq(laporanHarianSchema.id_laporan_sb, laporanSb.id)
    )
    .leftJoin(pengamatan, eq(pengamatan.id, laporanHarianSchema.pengamatan_id))
    .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .where(
      and(
        !!startDate ? gte(laporanSb.tanggal_laporan_sb, startDate) : undefined,
        !!endDate ? lte(laporanSb.tanggal_laporan_sb, endDate) : undefined,
        !!provinsiId ? eq(provinsi.id, provinsiId) : undefined,
        !!tanamanId ? eq(tanaman.id, parseInt(tanamanId)) : undefined
      )
    );

  const result = laporanSbData.reduce<
    Record<
      string,
      LaporanSb & {
        laporan_harian: (LaporanHarian & { pengamatan: Pengamatan })[];
        lokasi: Lokasi & { provinsi: Provinsi };
      }
    >
  >((acc, row, index) => {
    const laporanSb = row.laporan_sb;
    const laporanHarian = row.laporan_harian;
    const pengamatan = row.pengamatan;
    const lokasi = row.lokasi;
    const provinsi = row.provinsi;

    const aggLaporanHarian = { ...laporanHarian, pengamatan };

    const finalRow = {
      ...laporanSb,
      laporan_harian: [aggLaporanHarian],
      lokasi: {
        ...lokasi,
        provinsi,
      },
    };
    if (!acc[laporanSb.id]) {
      acc[laporanSb.id] = finalRow;
    } else if (acc[laporanSb.id]) {
      acc[laporanSb.id].laporan_harian.push(aggLaporanHarian);
    }
    return acc;
  }, {});

  const foo = Object.entries(result).map(([_, value]) => value);

  const komoditasOption = await db.query.tanaman.findMany({
    orderBy: tanaman.nama_tanaman,
  });
  const provinsiOption = await db.query.provinsi.findMany({
    orderBy: provinsi.nama_provinsi,
  });

  return c.html(
    <DefaultLayout
      route="laporan-sb"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <LaporanSbPage
        komoditasOption={komoditasOption}
        provinsiOption={provinsiOption}
        laporanSbList={foo}
      />
    </DefaultLayout>
  );
});

laporanSbRoute.get('/filter', async (c) => {
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  const tanamanId = c.req.query('tanaman_id');
  const provinsiId = c.req.query('provinsi_id');

  const laporanSbData = await db.query.laporanSb.findMany({
    with: {
      laporanHarian: {
        with: {
          pengamatan: {
            with: {
              tanaman: true,
              locations: {
                with: {
                  provinsi: true,
                },
              },
            },
          },
        },
      },
    },
    where: and(
      !!startDate ? gte(laporanSb.tanggal_laporan_sb, startDate) : undefined,
      !!endDate ? lte(laporanSb.tanggal_laporan_sb, endDate) : undefined,
      !!provinsiId ? eq(provinsi.id, provinsiId) : undefined,
      !!tanamanId ? eq(tanaman.id, parseInt(tanamanId)) : undefined
    ),
    orderBy: laporanSb.id,
  });

  const newUrl = new URLSearchParams('');
  !!startDate && newUrl.append('start_date', startDate);
  !!endDate && newUrl.append('end_date', endDate);
  !!tanamanId && newUrl.append('tanaman_id', tanamanId);
  !!provinsiId && newUrl.append('provinsi_id', provinsiId);

  return c.html(
    <Fragment>
      {laporanSbData.map((row) => {
        return (
          <tr key={row.id}>
            {columnLaporanSb.map((column) => {
              return (
                <td class="border-b border-gray-200">
                  {column?.valueGetter?.(row) || row[column.field]}
                </td>
              );
            })}
          </tr>
        );
      }) || null}
    </Fragment>,
    200,
    {
      'HX-Replace-Url': `/app/laporan/sb?` + newUrl.toString(),
    }
  );
});

laporanSbRoute.get('/:laporanSbId', async (c) => {
  const laporanSbId = c.req.param('laporanSbId');

  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const selectedUser = await db.query.user
    .findFirst({
      where: eq(user.id, parseInt(userId)),
      with: {
        userGroup: true,
      },
    })
    .catch((err) => {
      console.error(err);
    });

  const laporanSbData = await db
    .select()
    .from(laporanSb)
    .leftJoin(
      laporanHarianSchema,
      eq(laporanHarianSchema.id_laporan_sb, laporanSb.id)
    )
    .where(eq(laporanSb.id, parseInt(laporanSbId)));

  const luasKerusakanQuery = await db
    .select()
    .from(luasKerusakanSb)
    .where(eq(luasKerusakanSb.laporan_sb_id, parseInt(laporanSbId)));

  const result = laporanSbData.reduce((acc, row) => {
    const laporanSb = row.laporan_sb;
    const laporanHarian = row.laporan_harian;

    if (!acc[laporanSb.id]) {
      acc[laporanSb.id] = {
        ...laporanSb,
        laporan_harian: [laporanHarian],
      };
    } else if (acc[laporanSb.id]) {
      acc[laporanSb.id].laporan_harian.push(laporanHarian);
    }
    return acc;
  }, {});

  result[laporanSbId].luas_kerusakan = luasKerusakanQuery;

  return c.html(
    <DefaultLayout
      route="laporan-sb"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <LaporanSbDetailPage laporanSb={result[laporanSbId]} />
    </DefaultLayout>
  );
});

const laporanBulananRoute = laporan.route('/bulanan');
laporanBulananRoute.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const selectedUser = await db.query.user
    .findFirst({
      where: eq(user.id, parseInt(userId)),
    })
    .catch((err) => {
      console.error(err);
    });

  const dataLaporanBulanan = await db.query.laporanBulanan.findMany({
    orderBy: laporanBulanan.id,
  });

  return c.html(
    <DefaultLayout
      route="laporan-bulanan"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <LaporanBulananPage laporanBulananData={dataLaporanBulanan} />
    </DefaultLayout>
  );
});

const laporanMusimanRoute = laporan.route('/musiman');
laporanMusimanRoute.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const selectedUser = await db.query.user
    .findFirst({
      where: eq(user.id, parseInt(userId)),
    })
    .catch((err) => {
      console.error(err);
    });

  const dataLaporanMusiman = await db.query.laporanMusiman.findMany({
    orderBy: laporanMusiman.id,
  });

  return c.html(
    <DefaultLayout
      route="laporan-musiman"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <LaporanMusimanPage dataLaporanMusiman={dataLaporanMusiman} />
    </DefaultLayout>
  );
});
