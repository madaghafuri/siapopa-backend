import { drizzle } from 'drizzle-orm/node-postgres';
import { Hono } from 'hono';
import { Client, Pool } from 'pg';
import api from './api/route';
import * as user from './db/schema/user';
import { logger } from 'hono/logger';
import * as desa from './db/schema/desa';
import * as detailRumpun from './db/schema/detail-rumpun';
import * as kabupatenKota from './db/schema/kabupaten-kota';
import * as kategoriLaporan from './db/schema/kategori-laporan';
import * as kecamatan from './db/schema/kecamatan';
import * as laporanBulanan from './db/schema/laporan-bulanan';
import * as laporanHarian from './db/schema/laporan-harian';
import * as laporanMusiman from './db/schema/laporan-musiman';
import * as laporanSb from './db/schema/laporan-sb';
import * as lokasi from './db/schema/lokasi';
import * as luasKerusakanSb from './db/schema/luas-kerusakan-sb';
import * as opt from './db/schema/opt';
import * as pengamatan from './db/schema/pengamatan';
import * as photoPengamatan from './db/schema/photo-pengamatan';
import * as provinsi from './db/schema/provinsi';
import * as rumpun from './db/schema/rumpun';
import * as tanaman from './db/schema/tanaman';
import * as userGroup from './db/schema/user-group';
import * as validasiLaporan from './db/schema/validasi-laporan';
import * as session from './db/schema/session';
import * as pestisida from './db/schema/pestisida';
import * as peramalan from './db/schema/peramalan';
import * as bahanAktif from './db/schema/bahan-aktif';
import * as golonganPestisida from './db/schema/golongan-pestisida';
import * as validator from './db/schema/validator';
import * as stockAph from './db/schema/stock-aph';
import * as bentukAph from './db/schema/bentuk-stok-aph';
import * as golonganAph from './db/schema/golongan-aph';
import * as rekomendasiPOPT from './db/schema/rekomendasi-popt';
import * as rincianRekomendasi from './db/schema/rincian-rekomendasi-popt';
import * as pengajuanPestisida from './db/schema/pengajuan-pestisida';
import * as pengeluaranBarang from './db/schema/pengeluaran-barang';
import * as peramalanKecamatan from './db/schema/peramalan-kecamatan';
import web from './web/route';
import { serveStatic } from 'hono/bun';
import { CookieStore, Session, sessionMiddleware } from 'hono-sessions';
import { auth } from './web/auth';
import {
  DrizzlePostgreSQLAdapter,
  PostgreSQLUserTable,
  type PostgreSQLSessionTable,
} from '@lucia-auth/adapter-drizzle';
import { Lucia, TimeSpan } from 'lucia';

export const client = new Client({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'db',
  port: 5432,
  database: process.env.DB_NAME || 'siapopa-dev',
  ssl: false,
});

(async () => await client.connect())();
export const db = drizzle(client, {
  schema: {
    ...desa,
    ...detailRumpun,
    ...kabupatenKota,
    ...kategoriLaporan,
    ...kecamatan,
    ...laporanBulanan,
    ...laporanHarian,
    ...laporanMusiman,
    ...laporanSb,
    ...lokasi,
    ...luasKerusakanSb,
    ...opt,
    ...pengamatan,
    ...photoPengamatan,
    ...provinsi,
    ...rumpun,
    ...tanaman,
    ...userGroup,
    ...user,
    ...validasiLaporan,
    ...session,
    ...bahanAktif,
    ...golonganPestisida,
    ...pestisida,
    ...peramalan,
    ...validator,
    ...stockAph,
    ...bentukAph,
    ...golonganAph,
    ...rekomendasiPOPT,
    ...rincianRekomendasi,
    ...pengajuanPestisida,
    ...pengeluaranBarang,
    ...peramalanKecamatan,
  },
});
const adapter = new DrizzlePostgreSQLAdapter(
  db,
  session.sessionTable as unknown as PostgreSQLSessionTable,
  user.user as unknown as PostgreSQLUserTable
);
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  sessionExpiresIn: new TimeSpan(2, 'w'),
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    UserId: number;
  }
}

const app = new Hono<{
  Variables: {
    session: Session;
    session_key_rotation: boolean;
  };
}>();

export var API_TOKEN = process.env.API_TOKEN || 'siapopa-dev';
const store = new CookieStore();

app.use(logger());
app.use(
  '/assets/*',
  serveStatic({
    root: './',
    rewriteRequestPath: (path) => path.replace(/^\/assets/, '/assets'),
  })
);
app.use(
  '/dist/*',
  serveStatic({
    root: './',
    rewriteRequestPath: (path) => path.replace(/^\/dist/, '/dist'),
  })
);
app.use(
  '/uploads/*',
  serveStatic({
    root: './',
    rewriteRequestPath: (path) => path.replace(/^\/uploads/, '/uploads'),
  })
);
app.use(
  '*',
  sessionMiddleware({
    store,
    encryptionKey: 'password_at_least_32_characters_long',
    expireAfterSeconds: 86400,
    cookieOptions: {
      sameSite: 'Lax',
      path: '/',
      httpOnly: true,
    },
  })
);

app.get('/', (c) => c.redirect('/app'));
app.route('/api/v1', api);
app.route('/app', web);
app.route('/', auth);

const port = 3000;
console.log(`Server is running on port ${port}`);

export default {
  port: 3000,
  fetch: app.fetch,
};
