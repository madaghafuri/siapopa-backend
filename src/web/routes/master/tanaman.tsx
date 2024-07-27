import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../..';
import { eq } from 'drizzle-orm';
import { user } from '../../../db/schema/user';
import { InsertTanaman, tanaman } from '../../../db/schema/tanaman';
import { DefaultLayout } from '../../layouts/default-layout';
import DataTanaman from '../../pages/master/tanaman';
import Profile, { AuthenticatedUser } from '../../components/profile';
import { authorizeWebInput } from '../../../middleware';
import { validator } from 'hono/validator';
import { ModalTanaman } from '../../components/master/modal-tanaman';
import { Fragment } from 'hono/jsx/jsx-runtime';

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

  const selectTanaman = await db.select().from(tanaman);

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
        <span class="text-sm text-red-500">nama tanaman belum dimaster</span>
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
        <span>Terjadi kesalahan dalam master data. Silahkan coba lagi</span>,
        500
      );
    }

    return c.html(<span>Berhasil master tanaman</span>, 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newTanaman, closeModal',
    });
  }
);
tanamanRoute.get('/create', async (c) => {
  return c.html(<ModalTanaman />);
});
tanamanRoute.get('/reload', async (c) => {
  const selectedTanaman = await db.select().from(tanaman).orderBy(tanaman.id);

  return c.html(
    <Fragment>
      {selectedTanaman.map((tanaman, index) => {
        return (
          <tr key={tanaman.id}>
            <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              {index + 1}
            </td>
            <td class="border-b border-gray-200 px-4 py-2">
              {tanaman.nama_tanaman}
            </td>
            <td class="border-b border-gray-200 px-4 py-2" style="width: 10%">
              <div class="flex items-center space-x-2">
                <button
                  class="text-blue-500 hover:text-blue-700 px-4"
                  hx-get={`/app/master/tanaman/edit/${tanaman.id}`}
                  hx-target="body"
                  hx-swap="beforeend"
                  >
                  <i class="fa fa-edit"></i>
                </button>
                <button
                  class="ml-2 text-red-500 hover:text-red-700 px-4"
                  hx-delete={`/app/master/tanaman/delete/${tanaman.id}`}
                  hx-target="#tanamanTable"
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
tanamanRoute.delete('/delete/:id', async (c) => {
  const id = c.req.param('id');

  try {
    await db.delete(tanaman).where(eq(tanaman.id, parseInt(id)));
  } catch (error) {
    return c.html(<span>Terjadi kesalahan dalam proses penghapusan data. Silahkan coba lagi</span>, 500);
  }

  return c.html(<span>Berhasil menghapus data</span>, 200, {
    'HX-Reswap': 'none',
    'HX-Trigger': 'newTanaman',
  });
});

tanamanRoute.get('/edit/:id', async (c) => {
  const id = c.req.param('id');
  const tanamanItem = await db.select().from(tanaman).where(eq(tanaman.id, parseInt(id)));

  return c.html(<ModalTanaman tanaman={tanamanItem[0]} />);
});

tanamanRoute.post('/edit/:id', authorizeWebInput, validator('form', (value, c) => {
  const { nama_tanaman } = value as unknown as InsertTanaman;

  if (!nama_tanaman) {
    return c.html(<span class="text-sm text-red-500">Data yang dibutuhkan tidak sesuai</span>);
  }

  return { nama_tanaman };
}), async (c) => {
  const id = c.req.param('id');
  const tanamanData = c.req.valid('form');

  try {
    await db.update(tanaman).set(tanamanData).where(eq(tanaman.id, parseInt(id)));
  } catch (error) {
    return c.html(<span>Terjadi kesalahan dalam proses pengeditan data. Silahkan coba lagi</span>, 500);
  }

  return c.html(<span>Berhasil mengedit data</span>, 200, {
    'HX-Reswap': 'none',
    'HX-Trigger': 'newTanaman, closeModal',
  });
});