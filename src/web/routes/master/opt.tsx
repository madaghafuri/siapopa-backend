import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { InsertOPT, opt } from '../../../db/schema/opt';
import { tanaman } from '../../../db/schema/tanaman';
import { eq } from 'drizzle-orm';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import DataOPT from '../../pages/master/opt';
import { db } from '../../..';
import { user } from '../../../db/schema/user';
import { authorizeWebInput } from '../../../middleware';
import { validator } from 'hono/validator';
import { ModalOpt } from '../../components/master/modal-opt';
import { Fragment } from 'hono/jsx/jsx-runtime';

export const optRoute = new Hono<{
  Variables: {
    session: Session;
  };
}>().basePath('/opt');
optRoute.get('/', async (c) => {
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

  const selectOpt = await db
    .select({
      id: opt.id,
      kode_opt: opt.kode_opt,
      nama_opt: opt.nama_opt,
      status: opt.status,
      tanaman_id: opt.tanaman_id,
      nama_tanaman: tanaman.nama_tanaman,
    })
    .from(opt)
    .leftJoin(tanaman, eq(tanaman.id, opt.tanaman_id))
    .where(eq(opt.jenis, 'opt'));

  return c.html(
    <DefaultLayout
      route="opt"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <DataOPT listOpt={selectOpt} user={selectedUser || null} />
    </DefaultLayout>
  );
});
optRoute.get('/create', async (c) => {
  const listTanaman = await db.select().from(tanaman).limit(50);

  return c.html(<ModalOpt listTanaman={listTanaman} />);
});
optRoute.post(
  '/',
  authorizeWebInput,
  validator('form', (value, c) => {
    const { kode_opt, nama_opt, status, jenis, tanaman_id } =
      value as unknown as InsertOPT;

    if (!kode_opt || !nama_opt || !status || !jenis || !tanaman_id) {
      return c.html(
        <span class="text-sm text-red-500">
          Data yang dibutuhkan tidak sesuai
        </span>
      );
    }
    return { kode_opt, nama_opt, status, jenis, tanaman_id };
  }),
  async (c) => {
    const optData = c.req.valid('form');

    try {
      await db.insert(opt).values({ ...optData });
    } catch (error) {
      console.error(error);
      return c.html(
        <span>
          Terjadi kesalahan dalam proses pengmasteran data. Silahkan coba lagi
        </span>,
        500
      );
    }

    return c.html(<span>Berhasil menambahkan data</span>, 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newOpt, closeModal',
    });
  }
);
optRoute.get('/reload', async (c) => {
  const selectOpt = await db
    .select({
      id: opt.id,
      kode_opt: opt.kode_opt,
      nama_opt: opt.nama_opt,
      status: opt.status,
      tanaman_id: opt.tanaman_id,
      nama_tanaman: tanaman.nama_tanaman,
    })
    .from(opt)
    .leftJoin(tanaman, eq(tanaman.id, opt.tanaman_id))
    .where(eq(opt.jenis, 'opt'))
    .orderBy(tanaman.id);
  return c.html(
    <Fragment>
      {selectOpt.map((opt, index) => {
        return (
          <tr key={opt.kode_opt}>
            <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              {index + 1}
            </td>
            <td class="border-b border-gray-200 px-4 py-2">
                {opt.kode_opt}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {opt.nama_opt}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {opt.status === 'mutlak' ? 'Mutlak' : 'Tidak Mutlak'}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {opt.nama_tanaman}
              </td>
                <td class="border-b border-gray-200 px-4 py-2" style="width: 10%">
                  <div class="flex items-center space-x-2">
                    <button
                      class="text-blue-500 hover:text-blue-700 px-4"
                      hx-get={`/app/master/opt/edit/${opt.id}`}
                      hx-target="body"
                      hx-swap="beforeend"
                    >
                      <i class="fa fa-edit"></i>
                    </button>
                    <button
                      class="ml-2 text-red-500 hover:text-red-700 px-4"
                      hx-delete={`/app/master/opt/delete/${opt.id}`}
                      hx-target="#optTable"
                      hx-swap="outerHTML"
                      hx-confirm="Are you sure you want to delete this item?"
                    >
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </td>
          </tr>
        );
      })}
    </Fragment>
  );
});
optRoute.delete('/delete/:id', async (c) => {
  const id = c.req.param('id');

  try {
    await db.delete(opt).where(eq(opt.id, parseInt(id)));
  } catch (error) {
    return c.html(<span>Terjadi kesalahan dalam proses penghapusan data. Silahkan coba lagi</span>, 500);
  }

  return c.html(<span>Berhasil menghapus data</span>, 200, {
    'HX-Reswap': 'none',
    'HX-Trigger': 'newOpt',
  });
});

optRoute.get('/edit/:id', async (c) => {
  const id = c.req.param('id');
  const listTanaman = await db.select().from(tanaman).limit(50);
  const optItem = await db.select().from(opt).where(eq(opt.id, parseInt(id)));

  return c.html(<ModalOpt listTanaman={listTanaman} opt={optItem[0]} />);
});

optRoute.post('/edit/:id', authorizeWebInput, validator('form', (value, c) => {
  const { kode_opt, nama_opt, status, jenis, tanaman_id } =
      value as unknown as InsertOPT;

    if (!kode_opt || !nama_opt || !status || !jenis || !tanaman_id) {
      return c.html(
        <span class="text-sm text-red-500">
          Data yang dibutuhkan tidak sesuai
        </span>
      );
    }
    return { kode_opt, nama_opt, status, jenis, tanaman_id };
}), async (c) => {
  const id = c.req.param('id');
  const optData = c.req.valid('form');

  try {
    await db.update(opt).set(optData).where(eq(opt.id, parseInt(id)));
  } catch (error) {
    return c.html(<span>Terjadi kesalahan dalam proses pengeditan data. Silahkan coba lagi</span>, 500);
  }

  return c.html(<span>Berhasil mengedit data</span>, 200, {
    'HX-Reswap': 'none',
    'HX-Trigger': 'newOpt, closeModal',
  });
});
