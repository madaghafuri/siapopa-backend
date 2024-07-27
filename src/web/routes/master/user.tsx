import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../..';
import { eq } from 'drizzle-orm';
import { user } from '../../../db/schema/user';
import { userGroup } from '../../../db/schema/user-group';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import DataUser from '../../pages/master/user';
import Modal, { ModalContent, ModalHeader } from '../../components/modal';

export const userRoute = new Hono<{
  Variables: {
    session: Session;
  };
}>().basePath('/user');
userRoute.get('/', async (c) => {
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

  const selectUser = await db
    .select({
      user_name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      validasi: user.validasi,
      user_group: userGroup.group_name,
    })
    .from(user)
    .leftJoin(userGroup, eq(user.usergroup_id, userGroup.id));

  return c.html(
    <DefaultLayout
      route="user"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <DataUser listUser={selectUser} />
    </DefaultLayout>
  );
});
userRoute.get('/create', async (c) => {
  return c.html(
    <Modal>
      <ModalHeader>Create User</ModalHeader>
      <ModalContent>
        <form>
          <div>
            <label>Email</label>
            <input type="text" />
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
});
