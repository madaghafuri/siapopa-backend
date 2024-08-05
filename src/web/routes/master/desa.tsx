import { Hono } from 'hono';
import { db } from '../../..';
import { Fragment } from 'hono/jsx/jsx-runtime';

export const desaRoute = new Hono().basePath('/desa');
desaRoute.get('/', async (c) => {
  const { kecamatan_id } = c.req.query();

  const desaData = await db.query.desa.findMany({
    columns: {
      point_desa: false,
      area_desa: false,
    },
    where: (desa, { and, eq }) =>
      and(!!kecamatan_id ? eq(desa.kecamatan_id, kecamatan_id) : undefined),
  });

  if (c.req.header('hx-request')) {
    return c.html(
      <Fragment>
        <option>Pilih Desa</option>
        {desaData.map((value) => {
          return <option value={value.id}>{value.nama_desa}</option>;
        })}
      </Fragment>
    );
  }

  return;
});
