import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../..';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import { KabupatenKotaPage } from '../../pages/master/kabupaten-kota';
import { authorizeWebInput } from '../../../middleware';
import { validator } from 'hono/validator';
import { kabupatenKota } from '../../../db/schema/kabupaten-kota';
import { sql } from 'drizzle-orm';

export const kabkotRoute = new Hono<{
  Variables: {
    session: Session;
  };
}>().basePath('/kabkot');
kabkotRoute.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const selectUser = await db.query.user
    .findFirst({
      columns: {
        password: false,
      },
      with: {
        userGroup: true,
      },
      where: (user, { eq }) => eq(user.id, parseInt(userId)),
    })
    .catch((err) => {
      console.error(err);
    });

  const dataKabKot = await db.query.kabupatenKota.findMany({
    columns: {
      point_kabkot: false,
      area_kabkot: false,
    },
    with: {
      provinsi: true,
    },
    orderBy: (kabkot, { asc }) => asc(kabkot.id),
  });

  return c.html(
    <DefaultLayout
      route="kabupaten-kota"
      authNavigation={!!selectUser ? <Profile user={selectUser} /> : null}
    >
      <KabupatenKotaPage kabkotList={dataKabKot} />
    </DefaultLayout>
  );
});
kabkotRoute.post(
  '/',
  authorizeWebInput,
  validator('form', (value) => value),
  async (c) => {
    const body = await c.req.formData();
    const geom = body.get('geom');
    const id = body.get('id') as string;
    const nama_kabkot = body.get('nama_kabkot') as string;

    const geomData = await (geom as Blob).json();
    await db.insert(kabupatenKota).values({
      id,
      nama_kabkot,
      provinsi_id: '32',
      area_kabkot: sql`ST_GeomFromGeoJSON(${JSON.stringify(geomData.features[0].geometry)})`,
      point_kabkot: [
        geomData.features[0].properties.longitude,
        geomData.features[0].properties.latitude,
      ],
    });

    return c.text('hello world', 200, {
      'HX-Reswap': 'none',
    });
  }
);
