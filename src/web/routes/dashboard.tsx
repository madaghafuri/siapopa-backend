import { Hono } from 'hono';
import { db } from '../../index.js';
import { eq } from 'drizzle-orm';
import { user } from '../../db/schema/user.js';
import { DefaultLayout } from '../layouts/default-layout';
import DashboardPage from '../pages/dashboard';
import Profile, { AuthenticatedUser } from '../components/profile.js';
import { Session } from 'hono-sessions';

export const dashboard = new Hono<{
  Variables: {
    session: Session;
    session_key_rotation: boolean;
  };
}>();

dashboard.get('/', async (c) => {
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
      route="dashboard"
      authNavigation={<Profile user={selectedUser as AuthenticatedUser} />}
    >
      <DashboardPage></DashboardPage>
    </DefaultLayout>
  );
});
