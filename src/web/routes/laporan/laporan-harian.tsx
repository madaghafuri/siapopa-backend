import { Hono } from 'hono';
import { db } from '../../..';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { user } from '../../../db/schema/user';
import {
  LaporanHarian,
  laporanHarian,
} from '../../../db/schema/laporan-harian';
import { Pengamatan, pengamatan } from '../../../db/schema/pengamatan';
import { opt } from '../../../db/schema/opt';
import { Lokasi, lokasi } from '../../../db/schema/lokasi';
import { Provinsi, provinsi } from '../../../db/schema/provinsi';
import {
  KabupatenKota,
  kabupatenKota,
} from '../../../db/schema/kabupaten-kota';
import { Kecamatan, kecamatan } from '../../../db/schema/kecamatan';
import { Desa, desa } from '../../../db/schema/desa';
import { tanaman } from '../../../db/schema/tanaman';
import LaporanHarianPage, {
  columnHeaders,
  DataLaporanHarian,
} from '../../pages/laporan/laporan-harian';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import { validator } from 'hono/validator';
import { Fragment } from 'hono/jsx/jsx-runtime';
import { Session } from 'hono-sessions';

export const laporanHarianRoute = new Hono<{
  Variables: {
    session: Session;
  };
}>().basePath('/harian');
laporanHarianRoute.get('/', async (c) => {
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
      laporan_harian: laporanHarian,
      pengamatan,
      opt: opt,
      pic: user,
      lokasi: {
        ...lokasi,
        provinsi: {
          id: provinsi.id,
          nama_provinsi: provinsi.nama_provinsi,
        },
        kabupaten_kota: {
          id: kabupatenKota.id,
          nama_kabkot: kabupatenKota.nama_kabkot,
          provinsi_id: kabupatenKota.provinsi_id,
        },
        kecamatan: {
          id: kecamatan.id,
          nama_kecamatan: kecamatan.nama_kecamatan,
          provinsi_id: kecamatan.provinsi_id,
          kabkot_id: kecamatan.kabkot_id,
        },
        desa: {
          id: desa.id,
          nama_desa: desa.nama_desa,
          provinsi_id: desa.provinsi_id,
          kabkot_id: desa.kabkot_id,
          kecamatan_id: desa.kecamatan_id,
        },
      },
    })
    .from(laporanHarian)
    .leftJoin(pengamatan, eq(pengamatan.id, laporanHarian.pengamatan_id))
    .leftJoin(tanaman, eq(tanaman.id, pengamatan.tanaman_id))
    .leftJoin(user, eq(user.id, laporanHarian.pic_id))
    .leftJoin(opt, eq(opt.id, laporanHarian.opt_id))
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
          ? gte(laporanHarian.tanggal_laporan_harian, startDate)
          : undefined,
        !!endDate
          ? lte(laporanHarian.tanggal_laporan_harian, endDate)
          : undefined
      )
    )
    .orderBy(desc(laporanHarian.tanggal_laporan_harian))
    .limit(50)
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
    const opt = value.opt;
    const pic = value.pic;

    return {
      ...laporan,
      pengamatan,
      lokasi,
      opt,
      pic,
    };
  });

  return c.html(
    <DefaultLayout
      route="laporan-harian"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
      user={selectedUser || null}
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
laporanHarianRoute.get(
  '/filter',
  validator('query', (value) => {
    return value;
  }),
  async (c) => {
    const { tanaman_id, provinsi_id, start_date, end_date } =
      c.req.query() as Record<keyof FilterLaporanQuery, string>;

    const bar = await db
      .select({
        laporan_harian: laporanHarian,
        pengamatan,
        lokasi: {
          ...lokasi,
          provinsi: {
            id: provinsi.id,
            nama_provinsi: provinsi.nama_provinsi,
          },
          kabupaten_kota: {
            id: kabupatenKota.id,
            nama_kabkot: kabupatenKota.nama_kabkot,
            provinsi_id: kabupatenKota.provinsi_id,
          },
          kecamatan: {
            id: kecamatan.id,
            nama_kecamatan: kecamatan.nama_kecamatan,
            provinsi_id: kecamatan.provinsi_id,
            kabkot_id: kecamatan.kabkot_id,
          },
          desa: {
            id: desa.id,
            nama_desa: desa.nama_desa,
            provinsi_id: desa.provinsi_id,
            kabkot_id: desa.kabkot_id,
            kecamatan_id: desa.kecamatan_id,
          },
        },
        tanaman: tanaman,
        pic: user,
        opt: opt,
      })
      .from(laporanHarian)
      .leftJoin(pengamatan, eq(pengamatan.id, laporanHarian.pengamatan_id))
      .leftJoin(tanaman, eq(tanaman.id, pengamatan.tanaman_id))
      .leftJoin(user, eq(user.id, laporanHarian.pic_id))
      .leftJoin(opt, eq(opt.id, laporanHarian.opt_id))
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
            ? gte(laporanHarian.tanggal_laporan_harian, start_date)
            : undefined,
          !!end_date
            ? lte(laporanHarian.tanggal_laporan_harian, end_date)
            : undefined
        )
      )
      .orderBy(desc(laporanHarian.tanggal_laporan_harian))
      .limit(25)
      .offset(0);

    const result: DataLaporanHarian[] = bar.map((value) => {
      const laporan = value.laporan_harian;
      const pengamatan = value.pengamatan;
      const lokasi = value.lokasi as Lokasi & {
        provinsi: Provinsi;
        kabupaten_kota: KabupatenKota;
        kecamatan: Kecamatan;
        desa: Desa;
      };
      const pic = value.pic;
      const tanaman = value.tanaman;
      const opt = value.opt;

      return {
        ...laporan,
        pengamatan,
        lokasi,
        pic,
        tanaman,
        opt,
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
