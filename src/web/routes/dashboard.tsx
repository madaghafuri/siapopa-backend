import { Hono } from 'hono';
import { db } from '../../';
import { and, asc, eq, inArray, max, sql } from 'drizzle-orm';
import { user } from '../../db/schema/user';
import { DefaultLayout } from '../layouts/default-layout';
import DashboardPage from '../pages/dashboard';
import Profile, { AuthenticatedUser } from '../components/profile';
import { Session } from 'hono-sessions';
import { kabupatenKota } from '../../db/schema/kabupaten-kota';
import { peramalan } from '../../db/schema/peramalan';
import {
  InsertPeramalanKecamatan,
  peramalanKecamatan,
} from '../../db/schema/peramalan-kecamatan';
import { kecamatan } from '../../db/schema/kecamatan';
import { opt } from '../../db/schema/opt';
import { validator } from 'hono/validator';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

export const dashboard = new Hono<{
  Variables: {
    session: Session;
    session_key_rotation: boolean;
  };
}>();

dashboard.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const { kabkot_id } = c.req.query();

  const selectedUser = await db.query.user
    .findFirst({
      where: eq(user.id, parseInt(userId)),
      with: {
        userGroup: true,
      },
      columns: {
        password: false,
      },
    })
    .catch((err) => {
      console.error(err);
    });

  const kabkotData = await db
    .select({
      id: kabupatenKota.id,
      point_kabkot: kabupatenKota.point_kabkot,
      area_kabkot: sql<{
        type: string;
        coordinates: any[];
      }>`ST_AsGeoJSON(${kabupatenKota.area_kabkot})::jsonb`,
      nama_kabkot: kabupatenKota.nama_kabkot,
      provinsi_id: kabupatenKota.provinsi_id,
    })
    .from(kabupatenKota)
    .where(and(!!kabkot_id ? eq(kabupatenKota.id, kabkot_id) : undefined));

  const optOptions = await db.query.opt.findMany({
    where: (opt, { eq }) => eq(opt.jenis, 'opt'),
    orderBy: (opt, { asc }) => asc(sql`cast(${opt.id} as int)`),
  });

  return c.html(
    <DefaultLayout
      route="dashboard"
      authNavigation={
        !!selectedUser ? (
          <Profile user={selectedUser as unknown as AuthenticatedUser} />
        ) : null
      }
      //@ts-ignore
      user={selectedUser || null}
    >
      <DashboardPage kabkotData={kabkotData[0]} optOptions={optOptions} />
    </DefaultLayout>
  );
});
dashboard.get('/map', async (c) => {
  const kodeOptList = c.req.queries('kode_opt[]');

  const peramalanData = await db
    .select({
      kabkot_id: peramalan.kabkot_id,
      nama_kabkot: kabupatenKota.nama_kabkot,
      area_kabkot: sql`ST_AsGeoJSON(${kabupatenKota.area_kabkot})::jsonb`,
      klts_mt_2023: sql<number>`sum(${peramalan.klts_sebelumnya})`,
      klts_mt_2024: sql<number>`sum(${peramalan.klts_antara})`,
      mt_2024: {
        minimum: sql<number>`sum(${peramalan.mt_min})`,
        prakiraan: sql<number>`sum(${peramalan.mt_prakiraan})`,
        maksimum: sql<number>`sum(${peramalan.mt_max})`,
      },
      klts: sql<number>`sum(${peramalan.klts})`,
      rasio: sql<number>`sum(${peramalan.rasio})`,
      rasio_max: sql<number>`sum(${peramalan.rasio_max})`,
    })
    .from(peramalan)
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, peramalan.kabkot_id))
    .groupBy(
      peramalan.kabkot_id,
      kabupatenKota.nama_kabkot,
      kabupatenKota.area_kabkot,
      kabupatenKota.id
    )
    .where(
      and(
        !!kodeOptList && kodeOptList.length > 0
          ? inArray(peramalan.kode_opt, kodeOptList)
          : undefined
      )
    )
    .orderBy(asc(sql`cast(${kabupatenKota.id} as int)`));

  if (peramalanData.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'data not found',
      },
      404
    );
  }

  return c.json({
    status: 200,
    message: 'success',
    data: peramalanData,
  });
});

dashboard.get('/peramalan/:kabkotId', async (c) => {
  const kodeOptList = c.req.queries('kode_opt[]');
  const kabkotId = c.req.param('kabkotId');

  const peramalanData = await db
    .select({
      id: peramalanKecamatan.id,
      nama_kecamatan: kecamatan.nama_kecamatan,
      area_kecamatan: sql`ST_ASGeoJSON(${kecamatan.area_kecamatan})::jsonb`,
      nama_kabkot: kabupatenKota.nama_kabkot,
      klts_prakiraan: peramalanKecamatan.klts_prakiraan,
      mt_prakiraan: peramalanKecamatan.mt_prakiraan,
      created_at: peramalanKecamatan.created_at,
      updated_at: peramalanKecamatan.updated_at,
    })
    .from(peramalanKecamatan)
    .leftJoin(kecamatan, eq(kecamatan.id, peramalanKecamatan.kecamatan_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, kecamatan.kabkot_id))
    .leftJoin(opt, eq(opt.id, peramalanKecamatan.opt_id))
    .where(
      and(
        eq(kabupatenKota.id, kabkotId),
        !!kodeOptList && kodeOptList.length > 0
          ? inArray(opt.kode_opt, kodeOptList)
          : undefined
      )
    );

  console.log(peramalanData);

  if (peramalanData.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'data not found',
      },
      404
    );
  }

  return c.json({
    status: 200,
    message: 'success',
    data: peramalanData,
  });
});

// dashboard.post(
//   '/peramalan',
//   validator('form', (value, c) => {
//     const { file, kabkot_id, tanaman_id } = value;

//     if (!file || !kabkot_id || !tanaman_id) {
//       return c.json(
//         {
//           status: 401,
//           message: 'missing required data',
//         },
//         401
//       );
//     }

//     return { file, kabkot_id, tanaman_id } as {
//       file: File;
//       kabkot_id: string;
//       tanaman_id: string;
//     };
//   }),
//   async (c) => {
//     const { file, kabkot_id, tanaman_id } = c.req.valid('form');
//     const buffer = await file.arrayBuffer();

//     const workbook = XLSX.read(buffer);
//     const worksheet = workbook.SheetNames;
//     const foo = workbook.Sheets[worksheet[0]];
//     const raw_data = XLSX.utils.sheet_to_json(foo, { header: 'A' });

//     const dataToInsert: InsertPeramalanKecamatan[] = [];

//     const kecamatanList = await db.query.kecamatan.findMany({
//       columns: {
//         id: true,
//         nama_kecamatan: true,
//       },
//       where: (kecamatan, { eq }) => eq(kecamatan.kabkot_id, kabkot_id),
//     });

//     const optList = await db.query.opt.findMany({
//       where: (opt, { and, eq }) =>
//         and(eq(opt.tanaman_id, parseInt(tanaman_id)), eq(opt.jenis, 'opt')),
//     });
//     console.log(kecamatanList);

//     raw_data.forEach((val) => {
//       /**
//        * A: No
//        * B: Kecamatan
//        * C: Kode OPT
//        */
//       console.log(val);
//       // if (!!val['A'] && !!val['B'] && val['B'] !== 'Kecamatan') return;
//       if (
//         !('A' in (val as object)) ||
//         !('B' in (val as object)) ||
//         val['B'] == 'Kecamatan'
//       )
//         return;
//       const kecamatanToFind = kecamatanList.find(
//         (kecval) => kecval.nama_kecamatan === val['B'].toUpperCase()
//       );
//       console.log(kecamatanToFind);
//       const optToFind = optList.find((optval) => optval.kode_opt === val['C']);
//       const tempData: InsertPeramalanKecamatan = {
//         opt_id: optToFind.id || null,
//         kecamatan_id: kecamatanToFind?.id || null,
//         klts_sebelumnya: val['D'],
//         klts_antara: val['E'],
//         proporsi: val['F'],
//         klts_prakiraan: isNaN(val['G'])
//           ? 0
//           : !!val['G']
//             ? Math.round(val['G'])
//             : 0,
//         mt_sebelumnya: 2023,
//         mt_antara: '2022/2023',
//         mt_prakiraan: 2024,
//       };
//       dataToInsert.push(tempData);
//     });

//     try {
//       var insertData = await db
//         .insert(peramalanKecamatan)
//         .values(dataToInsert)
//         .returning();
//     } catch (error) {
//       console.error(error);
//       return c.json(
//         {
//           status: 500,
//           message: error,
//         },
//         500
//       );
//     }

//     console.log(insertData.length);

//     return c.json({
//       status: 200,
//       message: 'success',
//       // data: insertData.length,
//     });
//   }
// );
