import { Hono } from 'hono';
import { authorizeWebInput } from '../../middleware.js';
import { DefaultLayout } from '../layouts/default-layout.js';
import { Session } from 'hono-sessions';
import { db } from '../../index.js';
import { and, eq, inArray } from 'drizzle-orm';
import { user } from '../../db/schema/user.js';
import Profile from '../components/profile.js';
import LaporanHarianPage from '../pages/laporan/laporan-harian.js';
import { lokasi } from '../../db/schema/lokasi.js';
import { laporanHarian as laporanHarianSchema } from '../../db/schema/laporan-harian.js';
import { pengamatan } from '../../db/schema/pengamatan.js';

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
    })
    .from(laporanHarianSchema)
    .leftJoin(pengamatan, eq(pengamatan.id, laporanHarianSchema.pengamatan_id))
    .where(
      and(
        !!locations && locations.length > 0
          ? inArray(lokasi.id, locations)
          : undefined
      )
    );

  console.log(listLaporan);

  return c.html(
    <DefaultLayout
      route="laporan-harian"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <LaporanHarianPage listLaporan={listLaporan} />
    </DefaultLayout>
  );
});
