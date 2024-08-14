import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { InsertOPT, opt } from '../../../db/schema/opt';
import { tanaman } from '../../../db/schema/tanaman';
import { eq } from 'drizzle-orm';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import DataOPT, { optColumn } from '../../pages/master/opt';
import { db } from '../../..';
import { user } from '../../../db/schema/user';
import { authorizeWebInput } from '../../../middleware';
import { validator } from 'hono/validator';
import { ModalOpt } from '../../components/master/modal-opt';
import { Fragment } from 'hono/jsx/jsx-runtime';
import Modal, { ModalContent, ModalHeader } from '../../components/modal';
import { Table } from '../../components/table';
import { html } from 'hono/html';

export const optRoute = new Hono<{
  Variables: {
    session: Session;
  };
}>().basePath('/opt');
optRoute.get('/', async (c) => {
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

  const selectOpt = await db.query.opt.findMany({
    with: {
      tanaman: true,
    },
    where: (opt, { eq }) => eq(opt.jenis, 'opt'),
  });

  if (c.req.header('hx-request')) {
    return c.html(
      <Fragment>
        <Table
          id="opt-table"
          columns={optColumn}
          rowsData={selectOpt}
          className="display hover nowrap max-w-full rounded-md bg-white"
        />
        {html`
          <script>
            $(document).ready(function () {
              $('#opt-table').DataTable({
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
      route="opt"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
      user={selectedUser || null}
    >
      <DataOPT listOpt={selectOpt} user={selectedUser || null} />
    </DefaultLayout>
  );
});
optRoute.get('/create', async (c) => {
  const listTanaman = await db.select().from(tanaman).limit(50);

  return c.html(<ModalOpt listTanaman={listTanaman} />);
});
optRoute.post(
  '/',
  authorizeWebInput,
  validator('form', (value, c) => {
    const { kode_opt, nama_opt, status, jenis, tanaman_id } =
      value as unknown as InsertOPT;

    if (!kode_opt || !nama_opt || !status || !jenis || !tanaman_id) {
      return c.html(
        <span class="text-sm text-red-500">
          Data yang dibutuhkan tidak sesuai
        </span>
      );
    }
    return { kode_opt, nama_opt, status, jenis, tanaman_id };
  }),
  async (c) => {
    const optData = c.req.valid('form');

    try {
      await db.insert(opt).values({ ...optData });
    } catch (error) {
      console.error(error);
      return c.html(
        <span>
          Terjadi kesalahan dalam proses pengmasteran data. Silahkan coba lagi
        </span>,
        500
      );
    }

    return c.html(<span>Berhasil menambahkan data</span>, 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newOpt, closeModal',
    });
  }
);
optRoute.get('/reload', async (c) => {
  const selectOpt = await db
    .select({
      id: opt.id,
      kode_opt: opt.kode_opt,
      nama_opt: opt.nama_opt,
      status: opt.status,
      tanaman_id: opt.tanaman_id,
      nama_tanaman: tanaman.nama_tanaman,
    })
    .from(opt)
    .leftJoin(tanaman, eq(tanaman.id, opt.tanaman_id))
    .where(eq(opt.jenis, 'opt'))
    .orderBy(tanaman.id);
  return c.html(
    <Fragment>
      {selectOpt.map((opt, index) => {
        return (
          <tr key={opt.kode_opt}>
            <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              {index + 1}
            </td>
            <td class="border-b border-gray-200 px-4 py-2">{opt.kode_opt}</td>
            <td class="border-b border-gray-200 px-4 py-2">{opt.nama_opt}</td>
            <td class="border-b border-gray-200 px-4 py-2">
              {opt.status === 'mutlak' ? 'Mutlak' : 'Tidak Mutlak'}
            </td>
            <td class="border-b border-gray-200 px-4 py-2">
              {opt.nama_tanaman}
            </td>
            <td class="border-b border-gray-200 px-4 py-2" style="width: 10%">
              <div class="flex items-center space-x-2">
                <button
                  class="px-4 text-blue-500 hover:text-blue-700"
                  hx-get={`/app/master/opt/edit/${opt.id}`}
                  hx-target="body"
                  hx-swap="beforeend"
                >
                  <i class="fa fa-edit"></i>
                </button>
                <button
                  class="ml-2 px-4 text-red-500 hover:text-red-700"
                  hx-delete={`/app/master/opt/delete/${opt.id}`}
                  hx-target="#optTable"
                  hx-swap="outerHTML"
                  hx-confirm="Are you sure you want to delete this item?"
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
optRoute.get('/delete/:id', async (c) => {
  const id = c.req.param('id');

  const opt = await db.query.opt.findFirst({
    where: (opt, { eq }) => eq(opt.id, parseInt(id)),
  });

  return c.html(
    <Modal>
      <ModalHeader>Delete User</ModalHeader>
      <ModalContent>
        <div class="text-center">
          <i class="fa-solid fa-triangle-exclamation text-7xl text-red-500"></i>
        </div>
        <h1 class="py-3 text-center text-xl font-bold">Are you sure?</h1>
        <p class="py-3 text-center">Deleting OPT {opt.nama_opt}</p>
        <div class="flex flex-col gap-5">
          <button
            hx-delete={`/app/master/opt/delete/${id}`}
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
optRoute.delete('/delete/:id', async (c) => {
  const id = c.req.param('id');

  try {
    await db.delete(opt).where(eq(opt.id, parseInt(id)));
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
    'HX-Trigger': 'newOpt, closeModal',
  });
});

optRoute.get('/edit/:id', async (c) => {
  const id = c.req.param('id');
  const listTanaman = await db.select().from(tanaman).limit(50);
  const optItem = await db
    .select()
    .from(opt)
    .where(eq(opt.id, parseInt(id)));

  return c.html(<ModalOpt listTanaman={listTanaman} opt={optItem[0]} />);
});

optRoute.post(
  '/edit/:id',
  authorizeWebInput,
  validator('form', (value, c) => {
    const { kode_opt, nama_opt, status, jenis, tanaman_id } =
      value as unknown as InsertOPT;

    if (!kode_opt || !nama_opt || !status || !jenis || !tanaman_id) {
      return c.html(
        <span class="text-sm text-red-500">
          Data yang dibutuhkan tidak sesuai
        </span>
      );
    }
    return { kode_opt, nama_opt, status, jenis, tanaman_id };
  }),
  async (c) => {
    const id = c.req.param('id');
    const optData = c.req.valid('form');

    try {
      await db
        .update(opt)
        .set(optData)
        .where(eq(opt.id, parseInt(id)));
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
      'HX-Trigger': 'newOpt, closeModal',
    });
  }
);
