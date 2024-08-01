import { Hono } from 'hono';
import { db } from '../../';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { user } from '../../db/schema/user';
import { DefaultLayout } from '../layouts/default-layout';
import DashboardPage from '../pages/dashboard';
import Profile, { AuthenticatedUser } from '../components/profile';
import { Session } from 'hono-sessions';
import { kabupatenKota } from '../../db/schema/kabupaten-kota';
import { peramalan } from '../../db/schema/peramalan';

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
          <Profile user={selectedUser as AuthenticatedUser} />
        ) : null
      }
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
