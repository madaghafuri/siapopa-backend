import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../..';
import { asc, eq, sql } from 'drizzle-orm';
import { InsertUser, SelectUser, user } from '../../../db/schema/user';
import { userGroup } from '../../../db/schema/user-group';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import DataUser, { userColumn } from '../../pages/master/user';
import Modal, { ModalContent, ModalHeader } from '../../components/modal';
import { html } from 'hono/html';
import { authorizeWebInput } from '../../../middleware';
import { validator } from 'hono/validator';
import { getValidKeyValuePairs } from '../../../helper';
import { Table } from '../../components/table';
import { Fragment } from 'hono/jsx/jsx-runtime';

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
      id: user.id,
      user_name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      validasi: user.validasi,
      user_group: userGroup.group_name,
    })
    .from(user)
    .leftJoin(userGroup, eq(user.usergroup_id, userGroup.id))
    .orderBy(asc(user.id));

  if (c.req.header('HX-Request')) {
    return c.html(
      <Fragment>
        <Table
          id="user-table"
          columns={userColumn}
          rowsData={selectUser}
          className="hover display nowrap max-w-full rounded bg-white"
        />
        {html`
          <script>
            $(document).ready(function () {
              $('#user-table').DataTable();
            });
          </script>
        `}
      </Fragment>
    );
  }

  return c.html(
    <DefaultLayout
      route="user"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
      user={selectedUser || null}
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
userRoute.get('/edit/:userId', authorizeWebInput, async (c) => {
  const userId = c.req.param('userId');
  const selectedUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, parseInt(userId)),
  });
  const userGroupOptions = await db.query.userGroup.findMany({
    orderBy: (user, { asc }) => asc(user.id),
  });
  const lokasiOptions = await db.query.lokasi.findMany({
    limit: 100,
    offset: 0,
  });

  return c.html(
    <Modal>
      <ModalHeader>Edit User</ModalHeader>
      <ModalContent>
        <form
          hx-put={`/app/master/user/${userId}`}
          hx-target="#error-message"
          hx-swap="innerHTML"
          hx-trigger="submit"
          class="grid grid-cols-2 gap-3"
        >
          <div class="flex flex-col gap-1">
            <label class="text-sm font-bold text-blue-500">Nama</label>
            <input
              name="user_name"
              type="text"
              value={selectedUser.name}
              class="rounded border border-gray-200 px-2 py-0.5"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-bold text-blue-500">Email</label>
            <input
              name="email"
              type="email"
              value={selectedUser.email}
              class="rounded border border-gray-200 px-2 py-0.5"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-bold text-blue-500">No. Telp</label>
            <input
              name="phone"
              type="tel"
              value={selectedUser.phone}
              class="rounded border border-gray-200 px-2 py-0.5"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-bold text-blue-500">User Group</label>
            <select
              name="usergroup_id"
              id="user-group-options"
              class="px-2 py-1"
              value={selectedUser.usergroup_id}
            >
              {userGroupOptions.map((option) => {
                return (
                  <option
                    value={option.id}
                    class="uppercase"
                    selected={option.id === selectedUser.usergroup_id}
                  >
                    {option.group_name}
                  </option>
                );
              })}
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-bold text-blue-500">Lokasi</label>
            <select name="lokasi_id" id="lokasi-options" class="px-2 py-1">
              {lokasiOptions.map((lokasi) => {
                return (
                  <option value={lokasi.id} class="uppercase">
                    {lokasi.alamat}
                  </option>
                );
              })}
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-bold text-blue-500">Validasi</label>
            <label class="switch">
              <input
                type="checkbox"
                name="validasi"
                checked={selectedUser.validasi === true}
              />
              <span class="slider round"></span>
            </label>
          </div>
          <div class="col-span-2" id="error-message"></div>
          <button
            class="col-span-2 rounded bg-primary px-2 py-1 text-white"
            hx-indicator="#loading"
            type="submit"
          >
            <div id="loading">
              <p>Edit</p>
              <i class="fa-solid fa-spinner"></i>
            </div>
          </button>
        </form>
        {html`
          <script>
            $(document).ready(function () {
              $('#user-group-options').select2({});
              $('#lokasi-options').select2();
            });
          </script>
        `}
      </ModalContent>
    </Modal>
  );
});
userRoute.put(
  '/:userId',
  authorizeWebInput,
  validator('form', (value) => {
    const validObj = getValidKeyValuePairs(value);
    return validObj;
  }),
  async (c) => {
    const userId = c.req.param('userId');
    const formData = c.req.valid('form') as unknown as Record<
      keyof SelectUser,
      SelectUser[keyof SelectUser]
    >;

    try {
      await db
        .update(user)
        .set({
          ...(formData as InsertUser),
          validasi: formData.validasi === 'on',
        })
        .where(eq(user.id, parseInt(userId)));
    } catch (error) {
      console.error(error);
      return c.html(
        <span class="text-sm text-red-500">Error. Silahkan coba lagi</span>
      );
    }

    return c.text('Success', 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'reloadUser, closeModal',
    });
  }
);
userRoute.get('/delete/:userId', authorizeWebInput, async (c) => {
  const userId = c.req.param('userId');
  const selectedUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, parseInt(userId)),
  });
  return c.html(
    <Modal>
      <ModalHeader>Delete User</ModalHeader>
      <ModalContent>
        <div class="text-center">
          <i class="fa-solid fa-triangle-exclamation text-7xl text-red-500"></i>
        </div>
        <h1 class="py-3 text-center text-xl font-bold">Are you sure?</h1>
        <p class="py-3 text-center">Deleting user {selectedUser.name}</p>
        <div class="flex flex-col gap-5">
          <button
            hx-delete={`/app/master/user/${userId}`}
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
userRoute.delete('/:userId', authorizeWebInput, async (c) => {
  const userId = c.req.param('userId');
  try {
    await db.delete(user).where(eq(user.id, parseInt(userId)));
  } catch (error) {
    console.error(error);
    return c.html(
      <span class="text-sm text-red-500">Error. Silahkan coba lagi</span>
    );
  }

  return c.text('Success', 200, {
    'HX-Reswap': 'none',
    'HX-Trigger': 'reloadUser, closeModal',
  });
});
