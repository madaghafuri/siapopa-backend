import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../';
import { eq } from 'drizzle-orm';
import { user } from '../../db/schema/user';
import { DefaultLayout } from '../layouts/default-layout';
import Profile from '../components/profile';
import { tanaman } from '../../db/schema/tanaman';
import { opt } from '../../db/schema/opt';
import { lokasi } from '../../db/schema/lokasi';
import { provinsi } from '../../db/schema/provinsi';
import { kabupatenKota } from '../../db/schema/kabupaten-kota';
import { kecamatan } from '../../db/schema/kecamatan';
import { desa } from '../../db/schema/desa';
import DataStockPestisida from '../pages/master/stock-pestisida';
import { pestisida } from '../../db/schema/pestisida';
import { golonganPestisida } from '../../db/schema/golongan-pestisida';
import DataGolonganPestisida from '../pages/master/golongan-pestisida';
import { peramalanRoute } from './master/peramalan';
import { tanamanRoute } from './master/tanaman';
import { optRoute } from './master/opt';
import { userRoute } from './master/user';
import { userGroupRoute } from './master/user-group';
import { lokasiRoute } from './master/lokasi';
import { kabkotRoute } from './master/kabupaten-kota';

export const master = new Hono<{
  Variables: {
    session: Session;
    session_key_rotation: boolean;
  };
}>();
master.route('/', tanamanRoute);
master.route('/', peramalanRoute);
master.route('/', optRoute);
master.route('/', userRoute);
master.route('/', userGroupRoute);
master.route('/', lokasiRoute);
master.route('/', kabkotRoute);

master.get('/stock-pestisida', async (c) => {
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

  const selectStockPestisida = await db
    .select({
      satuan: pestisida.satuan,
      nama_opt: opt.nama_opt,
      nama_tanaman: tanaman.nama_tanaman,
      volume: pestisida.volume,
      provinsi: provinsi.nama_provinsi,
      kabupatenKota: kabupatenKota.nama_kabkot,
      kecamatan: kecamatan.nama_kecamatan,
      desa: desa.nama_desa,
      nama_golongan: golonganPestisida.nama_golongan,
    })
    .from(pestisida)
    .leftJoin(opt, eq(opt.id, pestisida.opt_id))
    .leftJoin(tanaman, eq(tanaman.id, opt.tanaman_id))
    .leftJoin(lokasi, eq(lokasi.id, pestisida.lokasi_id))
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
    .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
    .leftJoin(desa, eq(desa.id, lokasi.desa_id))
    .leftJoin(
      golonganPestisida,
      eq(golonganPestisida.id, pestisida.golongan_pestisida_id)
    );

  return c.html(
    <DefaultLayout
      route="stock-pestisida"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <DataStockPestisida
        listStockPestisida={selectStockPestisida}
        user={selectedUser || null}
      />
    </DefaultLayout>
  );
});

master.get('/golongan-pestisida', async (c) => {
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

  const selectGolonganPestisida = await db.select().from(golonganPestisida);

  return c.html(
    <DefaultLayout
      route="golongan-pestisida"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <DataGolonganPestisida
        listGolonganPestisida={selectGolonganPestisida}
        user={selectedUser || null}
      />
    </DefaultLayout>
  );
});
