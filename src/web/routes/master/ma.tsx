import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { SelectUser } from '../../../db/schema/user';
import { SelectUserGroup } from '../../../db/schema/user-group';
import { Lokasi } from '../../../db/schema/lokasi';
import { db } from '../../..';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import { maColumn, MaPage } from '../../pages/master/ma';
import {} from 'hono/jsx/jsx-runtime';
import Modal, { ModalContent, ModalHeader } from '../../components/modal';
import { validator } from 'hono/validator';
import { InsertOPT, opt } from '../../../db/schema/opt';
import { eq, sql } from 'drizzle-orm';

export const maRoute = new Hono<{
  Variables: {
    session: Session;
    user: SelectUser & { userGroup: SelectUserGroup; locations: Lokasi[] };
  };
}>().basePath('/ma');

maRoute.get('/', async (c) => {
  const selectedUser = c.get('user');
  const { page, per_page } = c.req.query();

  const selectMa = await db.query.opt.findMany({
    with: {
      tanaman: true,
    },
    where: (opt, { eq }) => eq(opt.jenis, 'ma'),
    orderBy: (ma, { asc }) => asc(sql`cast(${ma.kode_opt} as int)`),
    limit: parseInt(per_page || '15'),
    offset: (parseInt(page || '1') - 1) * parseInt(per_page || '15'),
  });

  const newUrl = new URLSearchParams(c.req.query());

  if (c.req.header('hx-request')) {
    return c.html(
      <>
        {selectMa.map((row, index) => {
          return (
            <tr class="border-y border-gray-200 hover:bg-zinc-100">
              {maColumn.map((col) => (
                <td class="p-2" style="white-space: nowrap;">
                  {col.valueGetter?.(row, index) || row[col.field]}
                </td>
              ))}
            </tr>
          );
        })}
      </>,
      200,
      { 'HX-Push-Url': '/app/master/ma?' + newUrl.toString() }
    );
  }

  return c.html(
    <DefaultLayout
      route="ma"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
      user={selectedUser || null}
    >
      <MaPage maList={selectMa} />
    </DefaultLayout>
  );
});

maRoute.get('/edit/:id', async (c) => {
  const selectUser = c.get('user');
  const maId = c.req.param('id');

  const selectedMa = await db.query.opt.findFirst({
    where: (ma, { eq }) => eq(ma.id, parseInt(maId)),
  });

  const tanamanOptions = await db.query.tanaman.findMany({
    limit: 100,
    offset: 0,
  });

  return c.html(
    <Modal>
      <ModalHeader>Edit MA</ModalHeader>
      <ModalContent>
        <form
          class="flex flex-col gap-3"
          hx-put={`/app/master/ma/${maId}`}
          hx-target="#error-message"
          hx-swap="innerHTML"
          hx-trigger="submit"
        >
          <div class="grid grid-cols-[40%,auto]">
            <label class="text-sm text-blue-700">
              Jenis MA <span class="text-red-500">*</span>
            </label>
            <select disabled class="rounded border border-gray-200 px-2 py-1">
              <option value="ma" selected={selectedMa.jenis === 'ma'}>
                MA
              </option>
            </select>
          </div>
          <div class="grid grid-cols-[40%,auto]">
            <label class="text-sm text-blue-700">
              Nama MA <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama_opt"
              value={selectedMa.nama_opt}
              class="rounded border border-gray-200 px-2 py-1"
            />
          </div>
          <div class="grid grid-cols-[40%,auto]">
            <label class="text-sm text-blue-700">
              Kode MA <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="kode_opt"
              value={selectedMa.kode_opt}
              class="rounded border border-gray-200 px-2 py-1"
            />
          </div>
          <div class="grid grid-cols-[40%,auto]">
            <label class="text-sm text-blue-700">
              Status <span class="text-red-500">*</span>
            </label>
            <select
              name="status"
              class="rounded border border-gray-200 px-2 py-1"
            >
              <option value="">Pilih Status</option>
              <option value="mutlak" selected={selectedMa.status === 'mutlak'}>
                Mutlak
              </option>
              <option
                value="tidak mutlak"
                selected={selectedMa.status === 'tidak mutlak'}
              >
                Tidak Mutlak
              </option>
            </select>
          </div>
          <div class="grid grid-cols-[40%,auto]">
            <label class="text-sm text-blue-700">
              Tanaman <span class="text-red-500">*</span>
            </label>
            <select
              name="tanaman_id"
              class="rounded border border-gray-200 px-2 py-1"
            >
              <option value="">Pilih Tanaman</option>
              {tanamanOptions.map((value) => (
                <option
                  value={value.id}
                  selected={selectedMa.tanaman_id === value.id}
                >
                  {value.nama_tanaman}
                </option>
              ))}
            </select>
          </div>
          <div id="error-message" class="text-sm text-red-500"></div>
          <button
            hx-indicator="#loading"
            type="submit"
            class="rounded bg-primary px-2 py-1 text-white"
          >
            <div id="loading">
              <p>Edit MA</p>
              <i class="fa-solid fa-spinner"></i>
            </div>
          </button>
        </form>
      </ModalContent>
    </Modal>
  );
});
maRoute.put(
  '/:id',
  validator('form', (value, c) => {
    return value as unknown as InsertOPT;
  }),
  async (c) => {
    const maId = c.req.param('id');
    const formData = c.req.valid('form');

    try {
      await db
        .update(opt)
        .set({ ...formData })
        .where(eq(opt.id, parseInt(maId)));
    } catch (error) {
      console.error(error);
      return c.html(<span>Terjadi kesalahan. Silahkan coba lagi</span>);
    }

    return c.text('Success', 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newMa, closeModal',
    });
  }
);

maRoute.get('/delete/:id', async (c) => {
  const maId = c.req.param('id');
  const selectedMa = await db.query.opt.findFirst({
    where: (ma, { eq }) => eq(ma.id, parseInt(maId)),
  });

  return c.html(
    <Modal>
      <ModalHeader>Delete Ma</ModalHeader>
      <ModalContent>
        <div class="text-center">
          <i class="fa-solid fa-triangle-exclamation text-7xl text-red-500"></i>
        </div>
        <h1 class="py-3 text-center text-xl font-bold">Are you sure?</h1>
        <p class="py-3 text-center">Deleting MA {selectedMa.nama_opt}</p>
        <div class="flex flex-col gap-5">
          <button
            hx-delete={`/app/master/ma/${maId}`}
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

maRoute.delete('/:id', async (c) => {
  const maId = c.req.param('id');
  try {
    await db.delete(opt).where(eq(opt.id, parseInt(maId)));
  } catch (error) {
    console.error(error);
    return c.html(<span>Terjadi kesalahan. Silahkan coba lagi</span>);
  }

  return c.text('Success', 200, {
    'HX-Reswap': 'none',
    'HX-Trigger': 'newMa, closeModal',
  });
});
