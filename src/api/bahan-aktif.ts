import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { SelectUser } from '../db/schema/user';
import { SelectUserGroup } from '../db/schema/user-group';
import { Lokasi } from '../db/schema/lokasi';
import { db } from '..';
import { authorizeApi } from '../middleware';

export const bahanAktifRoute = new Hono<{
  Variables: {
    session: Session;
    user: Omit<SelectUser, 'password'> & {
      userGroup: SelectUserGroup;
      locations: Lokasi[];
    };
  };
}>().basePath('bahan-aktif');
bahanAktifRoute.use('*', authorizeApi);

bahanAktifRoute.get('/', async (c) => {
  const selectBahanAktif = await db.query.bahanAktif.findMany({ limit: 100 });

  if (selectBahanAktif.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'data not found',
      },
      404
    );
  }

  return c.json({
    status: 200,
    message: 'success',
    data: selectBahanAktif,
  });
});
bahanAktifRoute.get('/:id', async (c) => {
  const bahanAktifId = c.req.param('id');

  try {
    var selectBahanAktif = await db.query.bahanAktif.findFirst({
      where: (bahanAktif, { eq }) => eq(bahanAktif.id, parseInt(bahanAktifId)),
    });
  } catch (error) {
    console.error(error);
    return c.json(
      {
        status: 500,
        message: error,
      },
      500
    );
  }

  return c.json({
    status: 200,
    message: 'success',
    data: selectBahanAktif,
  });
});
