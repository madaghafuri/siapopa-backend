import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../..';
import { eq } from 'drizzle-orm';
import { user } from '../../../db/schema/user';
import { InsertUserGroup, userGroup } from '../../../db/schema/user-group';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile, { AuthenticatedUser } from '../../components/profile';
import DataUserGroup, { userGroupColumn } from '../../pages/master/usergroup';
import { ModalUserGroup } from '../../components/master/modal-usergroup';
import { authorizeWebInput } from '../../../middleware';
import { validator } from 'hono/validator';
import { Fragment } from 'hono/jsx/jsx-runtime';
import Modal, { ModalContent, ModalHeader } from '../../components/modal';
import { Table } from '../../components/table';
import { html } from 'hono/html';

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

  if (c.req.header('hx-request')) {
    return c.html(
      <Fragment>
        <Table
          id="user-group-table"
          columns={userGroupColumn}
          rowsData={selectUserGroup}
          className="hover display nowrap max-w-full rounded bg-white"
        />
        {html`
          <script>
            $(document).ready(function () {
              $('#user-group-table').DataTable();
            });
          </script>
        `}
      </Fragment>
    );
  }

  return c.html(
    <DefaultLayout
      route="usergroup"
      authNavigation={
        !!selectedUser ? (
          <Profile user={selectedUser as AuthenticatedUser} />
        ) : null
      }
      user={selectedUser || null}
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
            <td class="border-b border-gray-200 px-4 py-2" style="width: 10%">
              <div class="flex items-center space-x-2">
                <button
                  class="px-4 text-blue-500 hover:text-blue-700"
                  hx-get={`/app/master/usergroup/edit/${userGroup.id}`}
                  hx-target="body"
                  hx-swap="beforeend"
                >
                  <i class="fa fa-edit"></i>
                </button>
                <button
                  class="ml-2 px-4 text-red-500 hover:text-red-700"
                  hx-delete={`/app/master/usergroup/delete/${userGroup.id}`}
                  hx-target="#tanamanTable"
                  hx-swap="outerHTML"
                >
                  <i class="fa fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </Fragment>
  );
});
userGroupRoute.get('/delete/:id', async (c) => {
  const id = c.req.param('id');
  const userGroup = await db.query.userGroup.findFirst({
    where: (group, { eq }) => eq(group.id, parseInt(id)),
  });

  return c.html(
    <Modal>
      <ModalHeader>Delete User</ModalHeader>
      <ModalContent>
        <div class="text-center">
          <i class="fa-solid fa-triangle-exclamation text-7xl text-red-500"></i>
        </div>
        <h1 class="py-3 text-center text-xl font-bold">Are you sure?</h1>
        <p class="py-3 text-center">
          Deleting user group {userGroup.group_name}
        </p>
        <div class="flex flex-col gap-5">
          <button
            hx-delete={`/app/master/usergroup/delete/${id}`}
            hx-trigger="click"
            hx-indicator="#loading"
            class="rounded bg-red-600 px-4 py-2 text-white"
          >
            <div id="loading">
              <p>Delete</p>
              <i class="fa-solid fa-spinner"></i>
            </div>
          </button>
          <button
            class="rounded border border-slate-200 px-4 py-2 hover:bg-slate-200"
            _="on click trigger closeModal"
          >
            Cancel
          </button>
        </div>
      </ModalContent>
    </Modal>
  );
});
userGroupRoute.delete('/delete/:id', authorizeWebInput, async (c) => {
  const id = c.req.param('id');

  try {
    await db.delete(userGroup).where(eq(userGroup.id, parseInt(id)));
  } catch (error) {
    return c.html(
      <span>
        Terjadi kesalahan dalam proses penghapusan data. Silahkan coba lagi
      </span>,
      500
    );
  }

  return c.html(<span>Berhasil menghapus data</span>, 200, {
    'HX-Reswap': 'none',
    'HX-Trigger': 'newUserGroup, closeModal',
  });
});

userGroupRoute.get('/edit/:id', async (c) => {
  const id = c.req.param('id');
  const usergroupItem = await db
    .select()
    .from(userGroup)
    .where(eq(userGroup.id, parseInt(id)));

  return c.html(<ModalUserGroup usergroup={usergroupItem[0]} />);
});

userGroupRoute.post(
  '/edit/:id',
  authorizeWebInput,
  validator('form', (value, c) => {
    const { group_name } = value as unknown as InsertUserGroup;

    if (!group_name) {
      return c.html(
        <span class="text-sm text-red-500">
          Data yang dibutuhkan tidak sesuai
        </span>
      );
    }

    return { group_name };
  }),
  async (c) => {
    const id = c.req.param('id');
    const userGroupData = c.req.valid('form');

    try {
      await db
        .update(userGroup)
        .set(userGroupData)
        .where(eq(userGroup.id, parseInt(id)));
    } catch (error) {
      return c.html(
        <span>
          Terjadi kesalahan dalam proses pengeditan data. Silahkan coba lagi
        </span>,
        500
      );
    }

    return c.html(<span>Berhasil mengedit data</span>, 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newUserGroup, closeModal',
    });
  }
);
