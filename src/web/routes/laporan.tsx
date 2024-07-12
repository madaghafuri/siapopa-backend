import { Hono } from 'hono';
import { DefaultLayout } from '../layouts/default-layout.js';
import { Session } from 'hono-sessions';
import { db } from '../../index.js';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { user } from '../../db/schema/user.js';
import Profile from '../components/profile.js';
import LaporanHarianPage, { DataLaporanHarian } from '../pages/laporan/laporan-harian.js';
import { Lokasi, lokasi } from '../../db/schema/lokasi.js';
import { LaporanHarian, laporanHarian as laporanHarianSchema } from '../../db/schema/laporan-harian.js';
import { Pengamatan, pengamatan } from '../../db/schema/pengamatan.js';
import { Provinsi, provinsi } from '../../db/schema/provinsi.js';
import { KabupatenKota, kabupatenKota } from '../../db/schema/kabupaten-kota.js';
import { Kecamatan, kecamatan } from '../../db/schema/kecamatan.js';
import { Desa, desa } from '../../db/schema/desa.js';
import { validator } from 'hono/validator';
import { tanaman } from '../../db/schema/tanaman.js';
import { ColumnHeader, Table } from '../components/table.js';
import { Fragment } from 'hono/jsx/jsx-runtime';

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
  const locations = c.req.queries('lokasi_id[]');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');

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
    .leftJoin(user, eq(user.id, laporanHarianSchema.pic_id))
    .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
    .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
    .leftJoin(desa, eq(desa.id, lokasi.desa_id))
    .where(
      and(
        !!locations && locations.length > 0
          ? inArray(lokasi.id, locations)
          : undefined,
        !!startDate
          ? gte(laporanHarianSchema.tanggal_laporan_harian, startDate)
          : undefined,
        !!endDate
          ? lte(laporanHarianSchema.tanggal_laporan_harian, endDate)
          : undefined
      )
    ).limit(25).offset(0);

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
    console.log(value);
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
        tanaman
      })
      .from(laporanHarianSchema)
      .leftJoin(
        pengamatan,
        eq(pengamatan.id, laporanHarianSchema.pengamatan_id)
      )
      .leftJoin(tanaman, eq(tanaman.id, pengamatan.tanaman_id))
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
      );

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

    const columnHeaders: ColumnHeader<LaporanHarian>[] = [
      { headerName: 'status', field: 'status_laporan_sb' },
      { headerName: 'foto', field: 'sign_pic' },
      { headerName: 'tgl lapor', field: 'tanggal_laporan_harian' },
      { headerName: 'tgl kunjungan', field: 'tanggal_laporan_harian' },
      { headerName: 'POPT' },
      { headerName: 'wilayah' },
      { headerName: 'komoditas' },
      { headerName: 'varietas' },
      { headerName: 'umur tanam', span: '1' },
      { headerName: 'luas tanam', span: '2' },
      { headerName: 'penyebab' },
      { headerName: 'keterangan' },
      { headerName: 'pic' }
    ];



    return c.html(
      <Fragment>
        {result.map((row) => {
          return <tr key={row.id}>
            {columnHeaders.map((column) => {
              return <td class="border-b bordery-gray-200 px-4 py-2">{row[column.field]}</td>
            })}
          </tr>
        })}
      </Fragment>
    );
  }
);
