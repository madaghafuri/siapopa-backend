import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../..';
import {} from 'hono/jsx/jsx-runtime';
import { lokasiColumn, LokasiPage } from '../../pages/master/lokasi';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import { ModalLokasi } from '../../components/master/modal-lokasi';
import { eq, inArray } from 'drizzle-orm';
import { authorizeWebInput } from '../../../middleware';
import { validator } from 'hono/validator';
import { InsertLokasi, lokasi } from '../../../db/schema/lokasi';
import Modal, { ModalContent, ModalHeader } from '../../components/modal';

export const lokasiRoute = new Hono<{
  Variables: {
    session: Session;
  };
}>().basePath('/lokasi');

lokasiRoute.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;
  const { page, per_page, alamat } = c.req.query();

  const selectedUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, parseInt(userId)),
    with: { userGroup: true, locations: true },
  });

  const lokasiData = await db.query.lokasi.findMany({
    with: {
      provinsi: {
        columns: {
          area_provinsi: false,
          point_provinsi: false,
        },
      },
      kabupaten_kota: {
        columns: {
          area_kabkot: false,
          point_kabkot: false,
        },
      },
      kecamatan: {
        columns: {
          area_kecamatan: false,
          point_kecamatan: false,
        },
      },
      desa: {
        columns: {
          area_desa: false,
          point_desa: false,
        },
      },
      user: true,
    },
    where: (lokasi, { ilike, and }) =>
      and(
        !!alamat ? ilike(lokasi.alamat, `%${alamat}%`) : undefined,
        selectedUser.userGroup.group_name !== 'bptph'
          ? inArray(
              lokasi.id,
              selectedUser.locations.map((val) => val.id)
            )
          : undefined
      ),
    limit: parseInt(per_page || '10'),
    offset: (parseInt(page || '1') - 1) * parseInt(per_page || '10'),
  });

  const newUrl = new URLSearchParams(c.req.query());

  if (c.req.header('hx-request') && c.req.header('hx-target') == 'table-body') {
    return c.html(
      <>
        {lokasiData.map((row, index) => {
          return (
            <tr class="border-y border-gray-200 hover:bg-zinc-100">
              {lokasiColumn.map((col) => {
                return (
                  <td class="px-4 py-2">
                    {col?.valueGetter?.(row, index) || row[col.field]}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </>,
      200,
      {
        'HX-Push-Url': '/app/master/lokasi?' + newUrl.toString(),
      }
    );
  }

  return c.html(
    <DefaultLayout
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
      route="lokasi"
      user={selectedUser || null}
    >
      <LokasiPage
        user={!!selectedUser ? selectedUser : null}
        lokasiList={lokasiData}
      />
    </DefaultLayout>
  );
});
lokasiRoute.get('/create', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const selectedUser = await db.query.user
    .findFirst({
      where: (user, { eq }) => eq(user.id, parseInt(userId)),
      with: {
        userGroup: true,
      },
    })
    .catch((err) => {
      console.error(err);
    });

  const provinsiOptions = await db.query.provinsi.findMany({
    limit: 100,
  });
  return c.html(<ModalLokasi provinsiOptions={provinsiOptions} />);
});

lokasiRoute.post(
  '/',
  authorizeWebInput,
  validator('form', (value, c) => {
    const { id, provinsi_id, kabkot_id, kecamatan_id, desa_id } = value;

    if (!id || !provinsi_id || !kabkot_id || !kecamatan_id || !desa_id) {
      return c.html(
        <span class="text-sm text-red-500">
          Data yang dibutuhkan tidak lengkap. Silahkan coba lagi
        </span>
      );
    }

    return value;
  }),
  async (c) => {
    const value = c.req.valid('form') as unknown as InsertLokasi;

    try {
      await db.insert(lokasi).values({ ...value });
    } catch (error) {
      console.error(error);
      return c.html(
        <span class="text-sm text-red-500">
          Terjadi kesalah. Silahkan coba lagi
        </span>
      );
    }

    return c.text('Success', 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newLokasi, closeModal',
    });
  }
);
lokasiRoute.get('/delete/:id', async (c) => {
  const lokasiId = c.req.param('id');
  const lokasi = await db.query.lokasi.findFirst({
    where: (lokasi, { eq }) => eq(lokasi.id, lokasiId),
  });

  return c.html(
    <Modal>
      <ModalHeader>Delete Lokasi</ModalHeader>
      <ModalContent>
        <div class="text-center">
          <i class="fa-solid fa-triangle-exclamation text-7xl text-red-500"></i>
        </div>
        <h1 class="py-3 text-center text-xl font-bold">Are you sure?</h1>
        <p class="py-3 text-center">Deleting lokasi {lokasi.alamat}</p>
        <div class="flex flex-col gap-5">
          <button
            hx-delete={`/app/master/lokasi/${lokasiId}`}
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
lokasiRoute.delete('/:id', authorizeWebInput, async (c) => {
  const lokasiId = c.req.param('id');

  try {
    await db.delete(lokasi).where(eq(lokasi.id, lokasiId));
  } catch (error) {
    console.error(error);
    return c.html(<span class="text-sm text-red-500"></span>);
  }

  return c.text('Success', 200, {
    'HX-Reswap': 'none',
    'HX-Trigger': 'newLokasi, closeModal',
  });
});
lokasiRoute.get('/edit/:id', async (c) => {
  const lokasiId = c.req.param('id');
  const lokasiData = await db.query.lokasi.findFirst({
    where: (lokasi, { eq }) => eq(lokasi.id, lokasiId),
  });

  return c.html(
    <Modal>
      <ModalHeader>Edit Lokasi</ModalHeader>
      <ModalContent>
        <form
          class="grid grid-cols-2 gap-3"
          hx-put={`/app/master/lokasi/${lokasiId}`}
          hx-trigger="submit"
        >
          <div class="flex flex-col gap-1">
            <label htmlFor="" class="text-sm text-blue-700">
              Alamat
            </label>
            <textarea
              type="text"
              name="alamat"
              class="rounded border border-gray-300 px-2 py-1"
            >
              {lokasiData.alamat}
            </textarea>
          </div>
          <div class="flex flex-col gap-1">
            <label htmlFor="" class="text-sm text-blue-700">
              Kode Pos
            </label>
            <input
              type="number"
              name="kode_post"
              class="rounded border border-gray-300 px-2 py-1"
            >
              {lokasiData.alamat}
            </input>
          </div>
          <button
            class="col-span-2 rounded bg-primary px-2 py-1 text-white"
            type="submit"
            hx-indicator="#loading"
          >
            <div id="loading">
              <p>Edit Lokasi</p>
              <i class="fa-solid fa-spinner"></i>
            </div>
          </button>
        </form>
      </ModalContent>
    </Modal>
  );
});
lokasiRoute.put(
  '/:id',
  authorizeWebInput,
  validator('form', (value) => value),
  async (c) => {
    const lokasiId = c.req.param('id');
    const foo = c.req.valid('form') as unknown as InsertLokasi;

    console.log(foo);

    try {
      await db
        .update(lokasi)
        .set({ alamat: foo.alamat, kode_post: foo.kode_post })
        .where(eq(lokasi.id, lokasiId));
    } catch (error) {
      console.error(error);
      return c.html(
        <span class="text-sm text-red-500">
          Terjadi kesalahan. Silahkan coba lagi
        </span>
      );
    }

    return c.text('Success', 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newLokasi, closeModal',
    });
  }
);
