import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../..';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { user } from '../../../db/schema/user';
import { LaporanSb, laporanSb } from '../../../db/schema/laporan-sb';
import {
  LaporanHarian,
  laporanHarian as laporanHarianSchema,
} from '../../../db/schema/laporan-harian';
import { Pengamatan, pengamatan } from '../../../db/schema/pengamatan';
import { Lokasi, lokasi } from '../../../db/schema/lokasi';
import { Provinsi, provinsi } from '../../../db/schema/provinsi';
import { tanaman } from '../../../db/schema/tanaman';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import {
  columnLaporanSb,
  LaporanSbDetailPage,
  LaporanSbPage,
} from '../../pages/laporan/laporan-sb';
import { Fragment } from 'hono/jsx/jsx-runtime';
import { luasKerusakanSb } from '../../../db/schema/luas-kerusakan-sb';
import { kabupatenKota } from '../../../db/schema/kabupaten-kota';
import { kecamatan } from '../../../db/schema/kecamatan';
import { desa } from '../../../db/schema/desa';
import { opt } from '../../../db/schema/opt';

export const laporanSbRoute = new Hono<{
  Variables: {
    session: Session;
  };
}>().basePath('/sb');
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
      user={selectedUser || null}
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

  const laporanSbData = await db.query.laporanSb.findFirst({
    with: {
      pic: true,
    },
    where: (laporan, { eq }) => eq(laporan.id, parseInt(laporanSbId)),
  });

  const selectFoo = await db
    .select({
      laporan_harian: laporanHarianSchema,
      pengamatan: pengamatan,
      opt,
      user: user,
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
    .from(laporanHarianSchema)
    .leftJoin(opt, eq(opt.id, laporanHarianSchema.opt_id))
    .leftJoin(user, eq(user.id, laporanHarianSchema.pic_id))
    .leftJoin(pengamatan, eq(pengamatan.id, laporanHarianSchema.pengamatan_id))
    .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
    .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
    .leftJoin(desa, eq(desa.id, lokasi.desa_id))
    .where(eq(laporanHarianSchema.id_laporan_sb, parseInt(laporanSbId)));

  const res = selectFoo.reduce((acc, row) => {
    const laporanHarian = row.laporan_harian;
    const pengamatan = row.pengamatan;
    const opt = row.opt;
    const pic = row.user;
    const lokasi = row.lokasi;
    const finalRow = {
      ...laporanHarian,
      pengamatan,
      opt,
      lokasi,
      pic,
    };

    acc.push(finalRow);

    return acc;
  }, []);

  const luasKerusakanQuery = await db
    .select()
    .from(luasKerusakanSb)
    .where(eq(luasKerusakanSb.laporan_sb_id, parseInt(laporanSbId)));

  const result = {
    ...laporanSbData,
    laporan_harian: res,
    luas_kerusakan: luasKerusakanQuery,
  };

  return c.html(
    <DefaultLayout
      route="laporan-sb"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
      user={selectedUser || null}
    >
      <LaporanSbDetailPage laporanSb={result} />
    </DefaultLayout>
  );
});
