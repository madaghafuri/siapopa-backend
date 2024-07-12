import { serve } from '@hono/node-server';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Hono } from 'hono';
import pg from 'pg';
import api from './api/route.js';
import * as user from './db/schema/user.js';
import { logger } from 'hono/logger';
import * as desa from './db/schema/desa.js';
import * as detailRumpun from './db/schema/detail-rumpun.js';
import * as kabupatenKota from './db/schema/kabupaten-kota.js';
import * as kategoriLaporan from './db/schema/kategori-laporan.js';
import * as kecamatan from './db/schema/kecamatan.js';
import * as laporanBulanan from './db/schema/laporan-bulanan.js';
import * as laporanHarian from './db/schema/laporan-harian.js';
import * as laporanMusiman from './db/schema/laporan-musiman.js';
import * as laporanSb from './db/schema/laporan-sb.js';
import * as lokasi from './db/schema/lokasi.js';
import * as luasKerusakanSb from './db/schema/luas-kerusakan-sb.js';
import * as opt from './db/schema/opt.js';
import * as pengamatan from './db/schema/pengamatan.js';
import * as photoPengamatan from './db/schema/photo-pengamatan.js';
import * as provinsi from './db/schema/provinsi.js';
import * as rumpun from './db/schema/rumpun.js';
import * as tanaman from './db/schema/tanaman.js';
import * as userGroup from './db/schema/user-group.js';
import * as validasiLaporan from './db/schema/validasi-laporan.js';
import * as session from './db/schema/session.js';
import web from './web/route.js';
import { serveStatic } from '@hono/node-server/serve-static';
import { CookieStore, Session, sessionMiddleware } from 'hono-sessions';
import { auth } from './web/auth.js';
import {
  DrizzlePostgreSQLAdapter,
  PostgreSQLUserTable,
  type PostgreSQLSessionTable,
} from '@lucia-auth/adapter-drizzle';
import { Lucia, TimeSpan } from 'lucia';
import multer from 'multer';
import path from 'path';
const { Client } = pg;

export const client = new Client({
  user: 'postgres',
  password: 'postgres',
  host: 'db',
  port: 5432,
  database: 'siapopa-dev',
  ssl: false,
});
await client.connect();
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
app.use('/uploads/*', serveStatic({
  root: './',
  rewriteRequestPath: (path) => path.replace(/^\/uploads/, '/uploads')
}))
app.use(
  '*',
  sessionMiddleware({
    store,
    encryptionKey: 'password_at_least_32_characters_long',
    expireAfterSeconds: 900,
    cookieOptions: {
      sameSite: 'Lax',
      path: '/',
      httpOnly: true,
    },
  })
);
// app.use('/app/*', authorizeWebInput);

app.get('/', (c) => c.redirect('/app'));
app.route('/api/v1', api);
app.route('/app', web);
app.route('/', auth);

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
