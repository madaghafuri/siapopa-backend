import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../..';
import { eq } from 'drizzle-orm';
import { user } from '../../../db/schema/user';
import { userGroup } from '../../../db/schema/user-group';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile, { AuthenticatedUser } from '../../components/profile';
import DataUserGroup from '../../pages/master/usergroup';
import { ModalUserGroup } from '../../components/master/modal-usergroup';
import { authorizeWebInput } from '../../../middleware';
import { validator } from 'hono/validator';
import { Fragment } from 'hono/jsx/jsx-runtime';

export const userGroupRoute = new Hono<{
  Variables: {
    session: Session;
  };
}>().basePath('/usergroup');
userGroupRoute.get('/', async (c) => {
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

  const selectUserGroup = await db.select().from(userGroup);

  return c.html(
    <DefaultLayout
      route="usergroup"
      authNavigation={
        !!selectedUser ? (
          <Profile user={selectedUser as AuthenticatedUser} />
        ) : null
      }
    >
      <DataUserGroup
        user={selectedUser || null}
        listUserGroup={selectUserGroup}
      />
    </DefaultLayout>
  );
});
userGroupRoute.get('/create', async (c) => {
  return c.html(<ModalUserGroup />);
});
userGroupRoute.post(
  '/',
  authorizeWebInput,
  validator('form', (value) => {
    return value;
  }),
  async (c) => {
    const { group_name } = c.req.valid('form');

    try {
      await db.insert(userGroup).values({ group_name: group_name as string });
    } catch (error) {
      return c.html(<span class="text-sm text-red-500">Error</span>);
    }

    return c.html(<span>Berhasil menambahkan data</span>, 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newUserGroup, closeModal',
    });
  }
);
userGroupRoute.get('/reload', async (c) => {
  const selectUserGroup = await db.query.userGroup.findMany({
    orderBy: userGroup.id,
  });

  return c.html(
    <Fragment>
      {selectUserGroup.map((userGroup, index) => {
        return (
          <tr key={userGroup.id}>
            <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              {index + 1}
            </td>
            <td class="border-b border-gray-200 px-4 py-2">
              {userGroup.group_name}
            </td>
          </tr>
        );
      })}
    </Fragment>
  );
});
