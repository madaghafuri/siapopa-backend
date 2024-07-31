import { Hono } from 'hono';
import { Session } from 'hono-sessions';
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
