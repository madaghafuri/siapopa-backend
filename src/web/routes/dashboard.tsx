import { Hono } from 'hono';
import { db } from '../../index.js';
import { and, eq, sql } from 'drizzle-orm';
import { user } from '../../db/schema/user.js';
import { DefaultLayout } from '../layouts/default-layout.js';
import DashboardPage from '../pages/dashboard.js';
import Profile, { AuthenticatedUser } from '../components/profile.js';
import { Session } from 'hono-sessions';
import { kabupatenKota } from '../../db/schema/kabupaten-kota.js';

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

  const kabkotOptions = await db.query.kabupatenKota.findMany({
    columns: {
      point_kabkot: false,
      area_kabkot: false,
    },
    orderBy: (kabkot, { asc }) => asc(kabkot.id),
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
      <DashboardPage kabkotData={kabkotData[0]} kabkotOptions={kabkotOptions} />
    </DefaultLayout>
  );
});
dashboard.get('/map', async (c) => {
  const { kabkot_id } = c.req.query();

  const kabKotData = await db
    .select({
      id: kabupatenKota.id,
      nama_kabkot: kabupatenKota.nama_kabkot,
      area_kabkot: sql`ST_AsGeoJSON(${kabupatenKota.area_kabkot})::jsonb`,
      provinsi_id: kabupatenKota.provinsi_id,
    })
    .from(kabupatenKota)
    .where(and(!!kabkot_id ? eq(kabupatenKota.id, kabkot_id) : undefined));

  return c.json({
    status: 200,
    message: 'success',
    data: kabKotData,
  });
});
