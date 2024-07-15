import { Hono } from 'hono';
import { DefaultLayout } from '../layouts/default-layout.js';
import { Session } from 'hono-sessions';
import { db } from '../../index.js';
import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { SelectUser, user } from '../../db/schema/user.js';
import Profile from '../components/profile.js';
import LaporanHarianPage, { columnHeaders, DataLaporanHarian } from '../pages/laporan/laporan-harian.js';
import { Lokasi, lokasi } from '../../db/schema/lokasi.js';
import { LaporanHarian, laporanHarian as laporanHarianSchema } from '../../db/schema/laporan-harian.js';
import { Pengamatan, pengamatan } from '../../db/schema/pengamatan.js';
import { Provinsi, provinsi } from '../../db/schema/provinsi.js';
import { KabupatenKota, kabupatenKota } from '../../db/schema/kabupaten-kota.js';
import { Kecamatan, kecamatan } from '../../db/schema/kecamatan.js';
import { Desa, desa } from '../../db/schema/desa.js';
import { validator } from 'hono/validator';
import { SelectTanaman, tanaman } from '../../db/schema/tanaman.js';
import { Fragment } from 'hono/jsx/jsx-runtime';
import { PengamatanDetailPage, PengamatanPage } from '../pages/laporan/pengamatan.js';
import { rumpun } from '../../db/schema/rumpun.js';
import { detailRumpun, Kerusakan } from '../../db/schema/detail-rumpun.js';
import { opt } from '../../db/schema/opt.js';
import { hasilPengamatan } from '../../api/helper.js';
import { userGroup } from '../../db/schema/user-group.js';

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
  const tanamanId = c.req.query('tanaman_id')
  const provinsiId = c.req.query('provinsi_id')

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
    .limit(25).offset(0);

  const tanamanList = await db.query.tanaman.findMany({
    orderBy: tanaman.id,
  });

  const provinsiList = await db.query.provinsi.findMany({
    orderBy: provinsi.nama_provinsi,
  });

  const result: DataLaporanHarian[] = listLaporan.map((value) => {
    const laporan = value.laporan_harian as LaporanHarian;
    const pengamatan = value.pengamatan as Pengamatan;
    const lokasi = value.lokasi as Lokasi & { provinsi: Provinsi; kabupaten_kota: KabupatenKota; kecamatan: Kecamatan; desa: Desa };

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
          desa
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
          !!tanaman_id ? eq(tanaman.id, parseInt(tanaman_id)) : undefined,
          !!provinsi_id ? eq(provinsi.id, provinsi_id) : undefined,
          !!start_date
            ? gte(laporanHarianSchema.tanggal_laporan_harian, start_date)
            : undefined,
          !!end_date
            ? lte(laporanHarianSchema.tanggal_laporan_harian, end_date)
            : undefined
        )
      ).orderBy(laporanHarianSchema.id)
      .limit(25)
      .offset(0);

    const result = bar.map((value) => {
      const laporan = value.laporan_harian;
      const pengamatan = value.pengamatan;
      const lokasi = value.lokasi;

      return {
        ...laporan,
        pengamatan,
        lokasi
      }
    });

    return c.html(
      <Fragment>
        {result.map((row) => {
          return <tr key={row.id}>
            {columnHeaders.map((column) => {
              return <td class="border-b bordery-gray-200 px-4 py-2 text-right">{row[column.field]}</td>
            })}
          </tr>
        })}
      </Fragment>,
      200,
      {
        'HX-Push-Url': c.req.url.replace('/filter', '')
      }
    );
  }
);

const pengamatanRoute = laporan.route('/pengamatan');

pengamatanRoute.get("/", async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const selectedUser = await db.query.user.findFirst({
    with: {
      userGroup: true
    },
    columns: {
      password: false
    },
    where: eq(user.id, parseInt(userId))
  }).catch((err) => {
    console.error(err);
  })

  const pengamatanList = await db.query.pengamatan.findMany({
    orderBy: pengamatan.id
  })

  return c.html(
    <DefaultLayout route='pengamatan' authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}>
      <PengamatanPage pengamatanList={pengamatanList} />
    </DefaultLayout>
  )
})
pengamatanRoute.get("/:pengamatanId", async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;
  const pengamatanId = c.req.param('pengamatanId')

  const selectedUser = await db.query.user.findFirst({
    with: {
      userGroup: true,
    },
    columns: {
      password: false
    },
    where: eq(user.id, parseInt(userId))
  }).catch((err) => {
    console.error(err)
  })

  const totalAnakan = db.$with('total_anakan').as(
    db
      .select({
        pengamatan_id: rumpun.pengamatan_id,
        total_anakan: sql<number>`sum(${rumpun.jumlah_anakan})`.as('total_jumlah_anakan')
      })
      .from(rumpun)
      .groupBy(rumpun.pengamatan_id)
  )

  const totalOpt = db.$with('total_opt').as(
    db.select({
      pengamatan_id: rumpun.pengamatan_id,
      skala_kerusakan: detailRumpun.skala_kerusakan,
      opt_id: detailRumpun.opt_id,
      kode_opt: opt.kode_opt,
      total_opt: sql<number>`sum(${detailRumpun.jumlah_opt})`.as('total_jumlah_opt')
    })
      .from(detailRumpun)
      .leftJoin(rumpun, eq(rumpun.id, detailRumpun.rumpun_id))
      .leftJoin(opt, eq(opt.id, detailRumpun.opt_id))
      .groupBy(detailRumpun.opt_id, detailRumpun.skala_kerusakan, rumpun.pengamatan_id, opt.kode_opt)
  )

  const pengamatanQuery = await db
    .with(totalOpt, totalAnakan)
    .select({
      pengamatan,
      total_anakan: {
        pengamatan_id: totalAnakan.pengamatan_id,
        total_anakan: totalAnakan.total_anakan
      },
      total_opt: {
        pengamatan_id: totalOpt.pengamatan_id,
        opt_id: totalOpt.opt_id,
        kode_opt: totalOpt.kode_opt,
        skala_kerusakan: totalOpt.skala_kerusakan,
        total_opt: totalOpt.total_opt
      },
      tanaman,
      pic: {
        ...user,
        user_group: userGroup
      },
      lokasi: {
        ...lokasi,
        provinsi,
        kabupaten_kota: kabupatenKota,
        kecamatan,
        desa
      }
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

  const result = pengamatanQuery.reduce<Record<string, {
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
    }[]
  }>>((acc, row) => {
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
      hasil_perhitungan: hasilPerhitungan
    }

    if (!acc[pengamatan.id]) {
      acc[pengamatan.id] = {
        pengamatan,
        lokasi: lokasi as Lokasi & {
          provinsi: Provinsi;
          kabupaten_kota: KabupatenKota;
          kecamatan: Kecamatan;
          desa: Desa
        },
        tanaman,
        pic,
        hasil_pengamatan: [hasil]
      }
    } else if (acc[pengamatan.id]) {
      acc[pengamatan.id].hasil_pengamatan.push(hasil)
    }

    return acc;
  }, {})

  return c.html(
    <DefaultLayout
      route='pengamatan-detail'
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <PengamatanDetailPage pengamatan={result[pengamatanId]} />
    </DefaultLayout>
  )
})
