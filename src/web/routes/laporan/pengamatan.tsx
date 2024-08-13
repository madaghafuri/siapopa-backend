import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../..';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { SelectUser, user } from '../../../db/schema/user';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import {
  pengamatanColumn,
  PengamatanDetailPage,
  PengamatanPage,
  PengamatanRumpunPage,
} from '../../pages/laporan/pengamatan';
import { Pengamatan, pengamatan } from '../../../db/schema/pengamatan';
import { Lokasi, lokasi } from '../../../db/schema/lokasi';
import { SelectTanaman, tanaman } from '../../../db/schema/tanaman';
import { Provinsi, provinsi } from '../../../db/schema/provinsi';
import { Fragment } from 'hono/jsx/jsx-runtime';
import { rumpun } from '../../../db/schema/rumpun';
import { detailRumpun, Kerusakan } from '../../../db/schema/detail-rumpun';
import { opt } from '../../../db/schema/opt';
import {
  LaporanHarian,
  laporanHarian,
} from '../../../db/schema/laporan-harian';
import { Desa, desa } from '../../../db/schema/desa';
import { Kecamatan, kecamatan } from '../../../db/schema/kecamatan';
import {
  KabupatenKota,
  kabupatenKota,
} from '../../../db/schema/kabupaten-kota';
import { userGroup } from '../../../db/schema/user-group';
import { PhotoPengamatan } from '../../../db/schema/photo-pengamatan';
import { hasilPengamatan } from '../../../api/helper';
import { getRelatedLocationsByUser } from '../../../helper';

export const pengamatanRoute = new Hono<{
  Variables: {
    session: Session;
  };
}>().basePath('/pengamatan');
pengamatanRoute.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const selectedUser = await db.query.user.findFirst({
    with: {
      userGroup: true,
      locations: true,
    },
    columns: {
      password: false,
    },
    where: eq(user.id, parseInt(userId)),
  });

  const assignedLocations = await getRelatedLocationsByUser(selectedUser);

  const pengamatanList = await db.query.pengamatan.findMany({
    with: {
      tanaman: true,
      locations: {
        with: {
          provinsi: {
            columns: {
              area_provinsi: false,
              point_provinsi: false,
            },
          },
        },
      },
      pic: true,
    },
    where: (pengamatan, { and, inArray }) =>
      and(
        selectedUser.userGroup.group_name !== 'bptph'
          ? inArray(
              pengamatan.lokasi_id,
              assignedLocations.map((val) => val.id)
            )
          : undefined
      ),
    orderBy: (pengamatan, { desc }) => desc(pengamatan.tanggal_pengamatan),
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
      user={selectedUser || null}
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
      pola_tanam: pengamatan.pola_tanam,
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
    )
    .orderBy(desc(pengamatan.tanggal_pengamatan));

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
      laporan_harian: laporanHarian,
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
    .from(pengamatan)
    .leftJoin(totalOpt, eq(totalOpt.pengamatan_id, pengamatan.id))
    .leftJoin(totalAnakan, eq(totalAnakan.pengamatan_id, pengamatan.id))
    .leftJoin(laporanHarian, eq(laporanHarian.pengamatan_id, pengamatan.id))
    .leftJoin(tanaman, eq(tanaman.id, pengamatan.tanaman_id))
    .leftJoin(user, eq(user.id, pengamatan.pic_id))
    .leftJoin(userGroup, eq(userGroup.id, user.usergroup_id))
    .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
    .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
    .leftJoin(desa, eq(desa.id, lokasi.desa_id))
    .where(eq(pengamatan.id, parseInt(pengamatanId)))
    .orderBy(desc(pengamatan.tanggal_pengamatan));

  const result = pengamatanQuery.reduce<
    Record<
      string,
      {
        pengamatan: Pengamatan;
        laporan_harian: LaporanHarian;
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
        bukti_pengamatan?: PhotoPengamatan[];
      }
    >
  >((acc, row) => {
    const pengamatan = row.pengamatan;
    const tanaman = row.tanaman;
    const lokasi = row.lokasi;
    const pic = row.pic;
    const laporanHarian = row.laporan_harian;

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
        laporan_harian: laporanHarian,
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

  const buktiPengamatanData = await db.query.photoPengamatan.findMany({
    where: (photo, { eq }) => eq(photo.pengamatan_id, parseInt(pengamatanId)),
  });

  const rumpunList = await db.query.rumpun.findMany({
    where: eq(rumpun.pengamatan_id, parseInt(pengamatanId)),
    orderBy: rumpun.id,
  });
  result[pengamatanId].bukti_pengamatan = buktiPengamatanData;

  return c.html(
    <DefaultLayout
      route="pengamatan-detail"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
      user={selectedUser || null}
    >
      <PengamatanDetailPage
        pengamatan={result[pengamatanId]}
        rumpunData={rumpunList}
      />
    </DefaultLayout>
  );
});
pengamatanRoute.get('/:pengamatanId/rumpun', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;
  const pengamatanId = c.req.param('pengamatanId');

  const selectedUser = await db.query.user
    .findFirst({
      where: (user, { eq }) => eq(user.id, parseInt(userId)),
      with: { userGroup: true },
    })
    .catch((err) => {
      console.error(err);
    });

  const rumpun = await db.query.rumpun.findMany({
    with: {
      detailRumpun: {
        with: {
          opt: true,
        },
      },
    },
    where: (rumpun, { eq }) => eq(rumpun.pengamatan_id, parseInt(pengamatanId)),
    orderBy: (rumpun, { asc }) => asc(rumpun.rumpun_ke),
  });

  return c.html(
    <DefaultLayout
      route="rumpun"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
      user={selectedUser || null}
    >
      <PengamatanRumpunPage rumpunList={rumpun} />
    </DefaultLayout>
  );
});
