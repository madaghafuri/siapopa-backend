import { Hono } from 'hono';
import { DefaultLayout } from '../layouts/default-layout.js';
import { Session } from 'hono-sessions';
import { db } from '../../index.js';
import { eq } from 'drizzle-orm';
import { user } from '../../db/schema/user.js';
import Profile from '../components/profile.js';
import { LaporanBulananPage } from '../pages/laporan/laporan-bulanan';
import { LaporanMusimanPage } from '../pages/laporan/laporan-musiman';
import { laporanHarianRoute } from './laporan/laporan-harian';
import { pengamatanRoute } from './laporan/pengamatan';
import { laporanSbRoute } from './laporan/laporan-sb.js';
import { laporanBulananRoute } from './laporan/laporan-bulanan.js';

export const laporan = new Hono<{
  Variables: {
    session: Session;
    session_rotation_key: boolean;
  };
}>();

laporan.route('/', laporanHarianRoute);
laporan.route('/', pengamatanRoute);
laporan.route('/', laporanSbRoute);
laporan.route('/', laporanBulananRoute);

const laporanMusimanRoute = laporan.route('/musiman');
laporanMusimanRoute.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const selectedUser = await db.query.user
    .findFirst({
      with: {
        userGroup: true,
      },
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
      user={selectedUser || null}
    >
      <LaporanMusimanPage dataLaporanMusiman={dataLaporanMusiman} />
    </DefaultLayout>
  );
});
