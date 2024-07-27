import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../..';
import { Fragment } from 'hono/jsx/jsx-runtime';
import { lokasiColumn, LokasiPage } from '../../pages/master/lokasi';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import { ModalLokasi } from '../../components/master/modal-lokasi';

export const lokasiRoute = new Hono<{
  Variables: {
    session: Session;
  };
}>().basePath('/lokasi');

lokasiRoute.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;
  const { page, per_page, alamat } = c.req.query();

  const selectedUser = await db.query.user
    .findFirst({
      where: (user, { eq }) => eq(user.id, parseInt(userId)),
    })
    .catch((err) => {
      console.error(err);
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
    },
    where: (lokasi, { ilike, and }) =>
      and(!!alamat ? ilike(lokasi.alamat, `%${alamat}%`) : undefined),
    limit: parseInt(page || '10'),
    offset:
      parseInt(page || '10') * parseInt(per_page || '1') -
      parseInt(page || '10'),
  });

  const newUrl = new URLSearchParams(c.req.query());

  if (c.req.header('hx-request') && c.req.header('hx-target') == 'table-body') {
    return c.html(
      <Fragment>
        {lokasiData.map((row, index) => {
          return (
            <tr class="grid grid-cols-8">
              {lokasiColumn.map((col) => {
                return (
                  <td class="border-r border-t border-gray-200 px-2 py-1">
                    {col?.valueGetter?.(row, index) || row[col.field]}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </Fragment>,
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
    })
    .catch((err) => {
      console.error(err);
    });
  return c.html(
    <DefaultLayout
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
      route="lokasi"
    >
      <ModalLokasi />
    </DefaultLayout>
  );
});
