import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../index.js';
import { eq } from 'drizzle-orm';
import { user } from '../../db/schema/user.js';
import { DefaultLayout } from '../layouts/default-layout.js';
import Profile, { AuthenticatedUser } from '../components/profile.js';
import { InsertTanaman, tanaman } from '../../db/schema/tanaman.js';
import { validator } from 'hono/validator';
import { InsertOPT, opt } from '../../db/schema/opt.js';
import DataOPT from '../pages/master/opt.js';
import { ModalOpt } from '../components/opt/modal-opt.js';
import { userGroup } from '../../db/schema/user-group.js';
import DataUser from '../pages/master/user.js';
import DataUserGroup from '../pages/master/usergroup.js';
import DataTanaman from '../pages/master/tanaman.js';
import Modal, { ModalContent, ModalHeader } from '../components/modal.js';
import { Fragment } from 'hono/jsx/jsx-runtime';
import { authorizeWebInput } from '../../middleware.js';

export const master = new Hono<{
  Variables: {
    session: Session;
    session_key_rotation: boolean;
  };
}>();
master.get('/tanaman', async (c) => {
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

  const selectTanaman = await db.select().from(tanaman);

  return c.html(
    <DefaultLayout
      route="tanaman"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <DataTanaman
        listTanaman={selectTanaman}
        user={(selectedUser as AuthenticatedUser) || null}
      />
    </DefaultLayout>
  );
});
master.post(
  '/tanaman',
  authorizeWebInput,
  validator('form', (value, c) => {
    const { nama_tanaman } = value as unknown as InsertTanaman;

    if (!nama_tanaman) {
      return c.html(
        <span class="text-sm text-red-500">nama tanaman belum dimaster</span>
      );
    }

    return nama_tanaman;
  }),
  async (c) => {
    const namaTanaman = c.req.valid('form');

    try {
      await db.insert(tanaman).values({ nama_tanaman: namaTanaman });
    } catch (error) {
      console.error(error);
      return c.html(
        <span>Terjadi kesalahan dalam master data. Silahkan coba lagi</span>,
        500
      );
    }

    return c.html(<span>Berhasil master tanaman</span>);
  }
);
master.get('/tanaman/create', async (c) => {
  return c.html(
    <Modal>
      <ModalHeader>Create Tanaman</ModalHeader>
      <ModalContent>Hello World</ModalContent>
    </Modal>
  );
});
master.get('/opt', async (c) => {
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
      kode_opt: opt.kode_opt,
      nama_opt: opt.nama_opt,
      status: opt.status,
      tanaman_id: opt.tanaman_id,
      nama_tanaman: tanaman.nama_tanaman,
    })
    .from(opt)
    .leftJoin(tanaman, eq(tanaman.id, opt.tanaman_id));

  return c.html(
    <DefaultLayout
      route="opt"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <DataOPT listOpt={selectOpt} user={selectedUser || null} />
    </DefaultLayout>
  );
});
master.get('/opt/create', async (c) => {
  const listTanaman = await db.select().from(tanaman).limit(50);

  return c.html(<ModalOpt listTanaman={listTanaman} />);
});
master.post(
  '/opt',
  authorizeWebInput,
  validator('form', (value, c) => {
    const { kode_opt, nama_opt, status, tanaman_id } =
      value as unknown as InsertOPT;

    if (!kode_opt || !nama_opt || !status || !tanaman_id) {
      return c.html(
        <span class="text-sm text-red-500">
          Data yang dibutuhkan tidak sesuai
        </span>
      );
    }
    return { kode_opt, nama_opt, status, tanaman_id };
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
master.get('/opt/reload', async (c) => {
  const selectOpt = await db
    .select({
      kode_opt: opt.kode_opt,
      nama_opt: opt.nama_opt,
      status: opt.status,
      tanaman_id: opt.tanaman_id,
      nama_tanaman: tanaman.nama_tanaman,
    })
    .from(opt)
    .leftJoin(tanaman, eq(tanaman.id, opt.tanaman_id));
  return c.html(
    <Fragment>
      {selectOpt.map((opt, index) => {
        return (
          <tr key={opt.kode_opt}>
            <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              {index + 1}
            </td>
            <td class="border-b border-gray-200 px-4 py-2" style="width: 15%">
              {opt.kode_opt}
            </td>
            <td class="border-b border-gray-200 px-4 py-2">{opt.nama_opt}</td>
            <td class="border-b border-gray-200 px-4 py-2">
              {opt.status === 'mutlak' ? 'Mutlak' : 'Tidak Mutlak'}
            </td>
            <td class="border-b border-gray-200 px-4 py-2">
              {opt.nama_tanaman}
            </td>
          </tr>
        );
      })}
    </Fragment>
  );
});
master.get('/user', async (c) => {
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

  const selectUser = await db
    .select({
      user_name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      validasi: user.validasi,
      user_group: userGroup.group_name,
    })
    .from(user)
    .leftJoin(userGroup, eq(user.usergroup_id, userGroup.id));

  return c.html(
    <DefaultLayout
      route="user"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <DataUser listUser={selectUser} user={selectedUser || null} />
    </DefaultLayout>
  );
});
master.get('/user/create', async (c) => {
  return c.html(
    <Modal>
      <ModalHeader>Create User</ModalHeader>
      <ModalContent>
        <form>
          <div>
            <label>Email</label>
            <input type="text" />
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
});
master.get('/usergroup', async (c) => {
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

  const selectUserGroup = await db.select().from(userGroup);

  return c.html(
    <DefaultLayout
      route="usergroup"
      authNavigation={
        !!selectedUser ? (
          <Profile user={selectedUser as AuthenticatedUser} />
        ) : null
      }
    >
      <DataUserGroup listUserGroup={selectUserGroup} />
    </DefaultLayout>
  );
});
