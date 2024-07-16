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
web.route('/master', master);

// laporan
web.route('/laporan', laporan);

web.get('/lokasi', async (c) => {
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

  return c.html(
    <DefaultLayout
      route="lokasi"
      authNavigation={<Profile user={selectedUser as AuthenticatedUser} />}
    ></DefaultLayout>
  );
});

export default web;
