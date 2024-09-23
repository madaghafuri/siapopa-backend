import { asc, eq, sql } from 'drizzle-orm';
import { db } from '../../..';
import { peramalan } from '../../../db/schema/peramalan';
import {} from 'hono/jsx/jsx-runtime';
import {
  PeramalanByKabKotPage,
  PeramalanPage,
} from '../../pages/master/peramalan';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { opt } from '../../../db/schema/opt';
import { kabupatenKota } from '../../../db/schema/kabupaten-kota';

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
      with: { userGroup: true },
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
      rasio: sql<number>`sum(${peramalan.rasio})`,
      rasio_max: sql<number>`sum(${peramalan.rasio_max})`,
    })
    .from(peramalan)
    .leftJoin(opt, eq(opt.kode_opt, peramalan.kode_opt))
    .groupBy(peramalan.kode_opt, opt.nama_opt)
    .orderBy(asc(sql`cast(${peramalan.kode_opt} as int)`));

  const peramalanDataByKabKot = await db
    .select({
      kabkot_id: peramalan.kabkot_id,
      nama_kabkot: kabupatenKota.nama_kabkot,
      klts_mt_2023: sql<number>`sum(${peramalan.klts_sebelumnya})`,
      klts_mt_2024: sql<number>`sum(${peramalan.klts_antara})`,
      mt_2024: {
        minimum: sql<number>`sum(${peramalan.mt_min})`,
        prakiraan: sql<number>`sum(${peramalan.mt_prakiraan})`,
        maksimum: sql<number>`sum(${peramalan.mt_max})`,
      },
      klts: sql<number>`sum(${peramalan.klts})`,
      rasio: sql<number>`sum(${peramalan.rasio})`,
      rasio_max: sql<number>`sum(${peramalan.rasio_max})`,
    })
    .from(peramalan)
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, peramalan.kabkot_id))
    .groupBy(peramalan.kabkot_id, kabupatenKota.nama_kabkot)
    .orderBy(asc(sql`cast(${peramalan.kabkot_id} as int)`));

  if (c.req.header('hx-request')) {
    return c.html(<></>, 200, {
      'HX-Push-Url': '/app/master/peramalan?' + newUrl.toString(),
    });
  }

  return c.html(
    <DefaultLayout
      route="peramalan"
      authNavigation={!!selectUser ? <Profile user={selectUser} /> : null}
      user={selectUser || null}
    >
      <PeramalanPage
        kabupatenData={kabkotOption}
        optOption={optOption}
        peramalanDataByOptList={peramalanDataByOpt}
        peramalanDataByKabKotList={peramalanDataByKabKot}
      />
    </DefaultLayout>
  );
});

peramalanRoute.get('/:kodeOpt', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;
  const kodeOpt = c.req.param('kodeOpt');

  const selectUser = await db.query.user
    .findFirst({
      where: (user, { eq }) => eq(user.id, parseInt(userId)),
      with: {
        userGroup: true,
      },
    })
    .catch((err) => {
      console.error(err);
    });

  const peramalanByKabKotData = await db
    .select({
      kabkot_id: peramalan.kabkot_id,
      nama_kabkot: kabupatenKota.nama_kabkot,
      klts_mt_2023: sql<number>`sum(${peramalan.klts_sebelumnya})`,
      klts_mt_2024: sql<number>`sum(${peramalan.klts_antara})`,
      mt_2024: {
        minimum: sql<number>`sum(${peramalan.mt_min})`,
        prakiraan: sql<number>`sum(${peramalan.mt_prakiraan})`,
        maksimum: sql<number>`sum(${peramalan.mt_max})`,
      },
      klts: sql<number>`sum(${peramalan.klts})`,
      rasio: sql<number>`sum(${peramalan.rasio})`,
      rasio_max: sql<number>`sum(${peramalan.rasio_max})`,
    })
    .from(peramalan)
    .leftJoin(opt, eq(opt.kode_opt, peramalan.kode_opt))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, peramalan.kabkot_id))
    .where(eq(peramalan.kode_opt, kodeOpt))
    .groupBy(peramalan.kabkot_id, kabupatenKota.nama_kabkot)
    .orderBy(asc(sql`cast(${peramalan.kabkot_id} as int)`));

  return c.html(
    <DefaultLayout
      route="peramalan"
      authNavigation={!!selectUser ? <Profile user={selectUser} /> : null}
      user={selectUser || null}
    >
      <PeramalanByKabKotPage peramalanData={peramalanByKabKotData} />
    </DefaultLayout>
  );
});
