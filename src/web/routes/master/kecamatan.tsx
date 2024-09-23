import { Hono } from 'hono';
import { db } from '../../..';
import { asc, sql } from 'drizzle-orm';
import { kecamatan } from '../../../db/schema/kecamatan';
import {} from 'hono/jsx/jsx-runtime';

export const kecamatanRoute = new Hono().basePath('/kecamatan');

kecamatanRoute.get('/', async (c) => {
  const { kabkot_id } = c.req.query();

  const kecamatanData = await db.query.kecamatan.findMany({
    columns: {
      area_kecamatan: false,
      point_kecamatan: false,
    },
    where: (kecamatan, { and, eq }) =>
      and(!!kabkot_id ? eq(kecamatan.kabkot_id, kabkot_id) : undefined),
    orderBy: asc(sql`cast(${kecamatan.id} as int)`),
  });

  if (c.req.header('hx-request')) {
    return c.html(
      <>
        <option>Pilih Kecamatan</option>
        {kecamatanData.map((value) => {
          return <option value={value.id}>{value.nama_kecamatan}</option>;
        })}
      </>
    );
  }

  return;
});
