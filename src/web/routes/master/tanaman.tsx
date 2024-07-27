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
          </tr>
        );
      })}
    </Fragment>
  );
});
