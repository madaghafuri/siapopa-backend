import { asc, eq, sql } from 'drizzle-orm';
import { db } from '../../..';
import { peramalan } from '../../../db/schema/peramalan';
import { Fragment } from 'hono/jsx/jsx-runtime';
import { peramalanColumn, PeramalanPage } from '../../pages/master/peramalan';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { opt } from '../../../db/schema/opt';

export const peramalanRoute = new Hono<{
  Variables: {
    session: Session;
    session_rotation_key: boolean;
  };
}>().basePath('/peramalan');
peramalanRoute.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const { page, per_page } = c.req.query();
  const kabkot_id = c.req.queries('kabkot_id[]');
  const kode_opt = c.req.queries('kode_opt[]');
  const perPage = parseInt(per_page || '10');

  const selectUser = await db.query.user
    .findFirst({
      where: (user, { eq }) => eq(user.id, parseInt(userId)),
    })
    .catch((err) => {
      console.error(err);
    });

  const kabkotOption = await db.query.kabupatenKota.findMany({
    columns: {
      point_kabkot: false,
      area_kabkot: false,
    },
    orderBy: (kabkot, { asc }) => asc(kabkot.id),
  });

  const optOption = await db.query.opt.findMany({
    orderBy: (opt, { desc }) => desc(opt.id),
  });

  const peramalanData = await db.query.peramalan.findMany({
    with: {
      kabupaten_kota: {
        columns: {
          area_kabkot: false,
          point_kabkot: false,
        },
      },
      opt: true,
    },
    where: (peramalan, { and, inArray }) =>
      and(
        !!kabkot_id ? inArray(peramalan.kabkot_id, kabkot_id) : undefined,
        !!kode_opt ? inArray(peramalan.kode_opt, kode_opt) : undefined
      ),
    orderBy: (peramalan, { desc }) => desc(peramalan.updated_date),
    limit: perPage,
    offset: (parseInt(page || '1') - 1) * perPage,
  });
  const newUrl = new URLSearchParams();
  !!kabkot_id && kabkot_id.forEach((val) => newUrl.append('kabkot_id[]', val));
  !!kode_opt && kode_opt.forEach((val) => newUrl.append('kode_opt[]', val));

  const peramalanDataByOpt = await db
    .select({
      kode_opt: peramalan.kode_opt,
      opt: opt.nama_opt,
      klts_mt_2023: sql<number>`sum(${peramalan.klts_sebelumnya})`,
      klts_mt_2024: sql<number>`sum(${peramalan.klts_antara})`,
      mt_2024: {
        minimum: sql<number>`sum(${peramalan.mt_min})`,
        prakiraan: sql<number>`sum(${peramalan.mt_prakiraan})`,
        maksimum: sql<number>`sum(${peramalan.mt_max})`,
      },
      klts: sql<number>`sum(${peramalan.klts})`,
    })
    .from(peramalan)
    .leftJoin(opt, eq(opt.kode_opt, peramalan.kode_opt))
    .groupBy(peramalan.kode_opt, opt.nama_opt)
    .orderBy(asc(sql`cast(${peramalan.kode_opt} as int)`));

  type PeramalanByOpt = typeof peramalanDataByOpt;

  if (c.req.header('hx-request')) {
    return c.html(
      <Fragment>
        {peramalanData.map((row, index) => {
          return (
            <tr key={row.id}>
              {peramalanColumn.map((col) => {
                return (
                  <td class="border-b border-r border-gray-200 px-4 py-2 text-left text-sm font-normal">
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
        'HX-Push-Url': '/app/master/peramalan?' + newUrl.toString(),
      }
    );
  }

  return c.html(
    <DefaultLayout
      route="peramalan"
      authNavigation={!!selectUser ? <Profile user={selectUser} /> : null}
    >
      <PeramalanPage
        peramalanData={peramalanData}
        kabupatenData={kabkotOption}
        optOption={optOption}
      />
    </DefaultLayout>
  );
});
