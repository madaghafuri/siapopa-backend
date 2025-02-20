import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../index.js';
import { eq } from 'drizzle-orm';
import { user } from '../db/schema/user.js';
import { DefaultLayout } from './layouts/default-layout.js';
import Profile, { AuthenticatedUser } from './components/profile.js';
import { dashboard } from './routes/dashboard.js';
import { master } from './routes/master.js';
import { laporan } from './routes/laporan.js';
import { stock } from './routes/stock.js';
import { authorize, checkACL } from '../middleware.js';
import { rekomendasiRoute } from './routes/rekomendasi.js';
import { peramalanRoute } from './routes/peramalan.js';

const web = new Hono<{
  Variables: {
    session: Session;
    session_key_rotation: boolean;
  };
}>();

web.get('/', (c) => c.redirect('/app/dashboard'));
web.notFound(async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const selectedUser = await db.query.user
    .findFirst({
      where: eq(user.id, parseInt(userId)),
    })
    .catch((err) => {
      console.error(err);
    });

  return c.html(
    <DefaultLayout
      route=""
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      THE PAGE YOU ARE LOOKING FOR DOES NOT EXIST
    </DefaultLayout>
  );
});

// Dashboard Related
web.route('/dashboard', dashboard);

// Master Data Input
web.use('/master/*', authorize, checkACL);
web.route('/master', master);

// laporan
web.use('/laporan/*', authorize, checkACL);
web.route('/laporan', laporan);

web.use('/stock/*', authorize, checkACL);
web.route('/stock', stock);

web.use('/rekomendasi/*', authorize, checkACL);
web.route('/rekomendasi', rekomendasiRoute);

web.use('/peramalan/*', authorize, checkACL);
web.route('/', peramalanRoute);

export default web;
