import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../..';
import { asc, eq } from 'drizzle-orm';
import { user } from '../../../db/schema/user';
import { InsertTanaman, tanaman } from '../../../db/schema/tanaman';
import { DefaultLayout } from '../../layouts/default-layout';
import DataTanaman, { columnTanaman } from '../../pages/master/tanaman';
import Profile, { AuthenticatedUser } from '../../components/profile';
import { authorizeWebInput } from '../../../middleware';
import { validator } from 'hono/validator';
import { ModalTanaman } from '../../components/master/modal-tanaman';
import { Fragment } from 'hono/jsx/jsx-runtime';
import { getValidKeyValuePairs } from '../../../helper';
import { Table } from '../../components/table';
import { html } from 'hono/html';
import Modal, { ModalContent, ModalHeader } from '../../components/modal';

export const tanamanRoute = new Hono<{
  Variables: {
    session: Session;
    session_rotation_key: boolean;
  };
}>().basePath('/tanaman');
tanamanRoute.get('/', async (c) => {
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

  const selectTanaman = await db
    .select()
    .from(tanaman)
    .orderBy(asc(tanaman.id));

  if (c.req.header('HX-Request')) {
    return c.html(
      <Fragment>
        <Table
          id="tanaman-table"
          className="display hover nowrap max-w-full rounded bg-white"
          columns={columnTanaman}
          rowsData={selectTanaman}
        />
        {html`
          <script>
            $(document).ready(function () {
              $('#tanaman-table').DataTable({
                scrollX: true,
              });
            });
          </script>
        `}
      </Fragment>
    );
  }

  return c.html(
    <DefaultLayout
      route="tanaman"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <DataTanaman
        listTanaman={selectTanaman}
        user={(selectedUser as AuthenticatedUser) || null}
      />
    </DefaultLayout>
  );
});
tanamanRoute.post(
  '/',
  authorizeWebInput,
  validator('form', (value, c) => {
    const { nama_tanaman } = value as unknown as InsertTanaman;

    if (!nama_tanaman) {
      return c.html(
        <span class="text-sm text-red-500">
          nama tanaman belum ditanamanRoute
        </span>
      );
    }

    return nama_tanaman;
  }),
  async (c) => {
    const namaTanaman = c.req.valid('form');

    try {
      await db.insert(tanaman).values({ nama_tanaman: namaTanaman });
    } catch (error) {
      console.error(error);
      return c.html(
        <span>
          Terjadi kesalahan dalam tanamanRoute data. Silahkan coba lagi
        </span>,
        500
      );
    }

    return c.html(<span>Berhasil tanamanRoute tanaman</span>, 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newTanaman, closeModal',
    });
  }
);
tanamanRoute.get('/create', async (c) => {
  return c.html(<ModalTanaman />);
});
tanamanRoute.get('/edit/:tanamanId', async (c) => {
  const tanamanId = c.req.param('tanamanId');
  const selectedTanaman = await db.query.tanaman.findFirst({
    where: (tanaman, { eq }) => eq(tanaman.id, parseInt(tanamanId)),
  });

  return c.html(
    <Modal>
      <ModalHeader>Edit Tanaman</ModalHeader>
      <ModalContent>
        <form
          class="flex flex-col gap-3"
          hx-put={`/app/master/tanaman/${selectedTanaman.id}`}
          hx-trigger="submit"
        >
          <div class="flex flex-col gap-1">
            <label class="text-sm font-bold text-blue-500">Nama Tanaman</label>
            <input
              type="text"
              value={selectedTanaman.nama_tanaman}
              name="nama_tanaman"
              class="rounded border border-gray-200 px-2 py-1"
            />
          </div>
          <button
            type="submit"
            hx-indicator="#loading"
            class="bg-primary px-2 py-1 text-white"
          >
            <div id="loading">
              <p>Edit</p>
              <i class="fa-solid fa-spinner"></i>
            </div>
          </button>
        </form>
      </ModalContent>
    </Modal>
  );
});
tanamanRoute.get('/delete/:tanamanId', async (c) => {
  const tanamanId = c.req.param('tanamanId');
  const selectedTanaman = await db.query.tanaman.findFirst({
    where: (tanaman, { eq }) => eq(tanaman.id, parseInt(tanamanId)),
  });
  return c.html(
    <Modal>
      <ModalHeader>Delete Tanaman</ModalHeader>
      <ModalContent>
        <div class="text-center">
          <i class="fa-solid fa-triangle-exclamation text-7xl text-red-500"></i>
        </div>
        <h1 class="py-3 text-center text-xl font-bold">Are you sure?</h1>

        <p class="py-3 text-center">
          Deleting tanaman {selectedTanaman.nama_tanaman}
        </p>

        <div class="flex flex-col gap-5">
          <button
            hx-delete={`/app/master/tanaman/${tanamanId}`}
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
tanamanRoute.delete('/:tanamanId', authorizeWebInput, async (c) => {
  const tanamanId = c.req.param('tanamanId');

  try {
    await db.delete(tanaman).where(eq(tanaman.id, parseInt(tanamanId)));
  } catch (error) {
    console.error(error);
    return c.html(
      <span class="text-sm text-red-500">Error. Silahkan coba lagi</span>
    );
  }

  return c.text('success', 200, {
    'HX-Reswap': 'none',
    'HX-Trigger': 'reloadTanaman, closeModal',
  });
});
tanamanRoute.put(
  '/:tanamanId',
  authorizeWebInput,
  validator('form', (value) => {
    const validatedValue = getValidKeyValuePairs(value);
    return validatedValue;
  }),
  async (c) => {
    const tanamanid = c.req.param('tanamanId');
    const formData = c.req.valid('form') as Record<
      keyof InsertTanaman,
      InsertTanaman[keyof InsertTanaman]
    >;

    try {
      await db
        .update(tanaman)
        .set({ ...(formData as InsertTanaman) })
        .where(eq(tanaman.id, parseInt(tanamanid)));
    } catch (error) {
      console.error(error);
      return c.html(
        <span class="text-sm text-red-500">
          Terjadi kesalahan. Silahkan coba lagi
        </span>
      );
    }

    return c.text('success', 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'reloadTanaman, closeModal',
    });
  }
);
