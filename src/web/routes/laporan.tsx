import { Hono } from 'hono';
import { DefaultLayout } from '../layouts/default-layout.js';
import { Session } from 'hono-sessions';
import { db } from '../../index.js';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { SelectUser, user } from '../../db/schema/user.js';
import Profile from '../components/profile.js';
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
import { LaporanBulananPage } from '../pages/laporan/laporan-bulanan';
import { LaporanMusimanPage } from '../pages/laporan/laporan-musiman';
import { luasKerusakanSb } from '../../db/schema/luas-kerusakan-sb';
import { laporanHarianRoute } from './laporan/laporan-harian';
import { pengamatanRoute } from './laporan/pengamatan';

export const laporan = new Hono<{
  Variables: {
    session: Session;
    session_rotation_key: boolean;
  };
}>();

laporan.route('/', laporanHarianRoute);
laporan.route('/', pengamatanRoute);

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
    )
    .orderBy(desc(laporanSb.tanggal_laporan_sb));

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
      laporan_harian: {
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
    orderBy: (laporan, { desc }) => desc(laporan.tanggal_laporan_sb),
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

  // const laporanSbData = await db
  //   .select()
  //   .from(laporanSb)
  //   .where(eq(laporanSb.id, parseInt(laporanSbId)));

  const laporanSbData = await db.query.laporanSb.findFirst({
    with: {
      pic: true,
    },
    where: (laporan, { eq }) => eq(laporan.id, parseInt(laporanSbId)),
  });

  const laporanHarianData = await db.query.laporanHarian.findMany({
    with: {
      pic: true,
    },
    where: (laporan, { eq }) =>
      eq(laporan.id_laporan_sb, parseInt(laporanSbId)),
  });

  const luasKerusakanQuery = await db
    .select()
    .from(luasKerusakanSb)
    .where(eq(luasKerusakanSb.laporan_sb_id, parseInt(laporanSbId)));

  const result = {
    ...laporanSbData,
    laporan_harian: laporanHarianData,
    luas_kerusakan: luasKerusakanQuery,
  };

  return c.html(
    <DefaultLayout
      route="laporan-sb"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <LaporanSbDetailPage laporanSb={result} />
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
    orderBy: (laporan, { desc }) => desc(laporan.tanggal_laporan_bulanan),
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
    orderBy: (laporan, { desc }) => desc(laporan.tanggal),
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
