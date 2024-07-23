import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../index.js';
import { and, eq, ilike, sql } from 'drizzle-orm';
import { user } from '../../db/schema/user.js';
import { DefaultLayout } from '../layouts/default-layout.js';
import Profile, { AuthenticatedUser } from '../components/profile.js';
import { InsertTanaman, tanaman } from '../../db/schema/tanaman.js';
import { validator } from 'hono/validator';
import { InsertOPT, opt } from '../../db/schema/opt.js';
import DataOPT from '../pages/master/opt.js';
import { ModalOpt } from '../components/master/modal-opt.js';
import { InsertUserGroup, userGroup } from '../../db/schema/user-group.js';
import DataUser from '../pages/master/user.js';
import DataUserGroup from '../pages/master/usergroup.js';
import DataTanaman from '../pages/master/tanaman.js';
import Modal, { ModalContent, ModalHeader } from '../components/modal.js';
import { Fragment } from 'hono/jsx/jsx-runtime';
import { authorizeWebInput } from '../../middleware.js';
import { ModalTanaman } from '../components/master/modal-tanaman.js';
import { ModalUserGroup } from '../components/master/modal-usergroup.js';
import { lokasiColumn, LokasiPage } from '../pages/master/lokasi.js';
import { lokasi } from '../../db/schema/lokasi.js';
import { provinsi } from '../../db/schema/provinsi.js';
import { kabupatenKota } from '../../db/schema/kabupaten-kota.js';
import { kecamatan } from '../../db/schema/kecamatan.js';
import { desa } from '../../db/schema/desa.js';
import { ModalLokasi } from '../components/master/modal-lokasi.js';
import { KabupatenKotaPage } from '../pages/master/kabupaten-kota.js';
import DataStockPestisida from '../pages/master/stock-pestisida.js';
import { pestisida } from '../../db/schema/pestisida.js';
import { golonganPestisida } from '../../db/schema/golongan-pestisida.js';
import DataGolonganPestisida from '../pages/master/golongan-pestisida.js';
import { withPagination } from '../../api/helper.js';

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

    return c.html(<span>Berhasil master tanaman</span>, 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newTanaman, closeModal',
    });
  }
);
master.get('/tanaman/create', async (c) => {
  return c.html(<ModalTanaman />);
});
master.get('/tanaman/reload', async (c) => {
  const selectedTanaman = await db.select().from(tanaman).orderBy(tanaman.id);

  return c.html(
    <Fragment>
      {selectedTanaman.map((tanaman, index) => {
        return (
          <tr key={tanaman.id}>
            <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              {index + 1}
            </td>
            <td class="border-b border-gray-200 px-4 py-2">
              {tanaman.nama_tanaman}
            </td>
          </tr>
        );
      })}
    </Fragment>
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
    .leftJoin(tanaman, eq(tanaman.id, opt.tanaman_id))
    .orderBy(tanaman.id);
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
      <DataUser listUser={selectUser} />
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
      <DataUserGroup
        user={selectedUser || null}
        listUserGroup={selectUserGroup}
      />
    </DefaultLayout>
  );
});
master.get('/usergroup/create', async (c) => {
  return c.html(<ModalUserGroup />);
});
master.post(
  '/usergroup',
  authorizeWebInput,
  validator('form', (value) => {
    return value;
  }),
  async (c) => {
    const { group_name } = c.req.valid('form');

    try {
      await db.insert(userGroup).values({ group_name: group_name as string });
    } catch (error) {
      return c.html(<span class="text-sm text-red-500">Error</span>);
    }

    return c.html(<span>Berhasil menambahkan data</span>, 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newUserGroup, closeModal',
    });
  }
);
master.get('/usergroup/reload', async (c) => {
  const selectUserGroup = await db.query.userGroup.findMany({
    orderBy: userGroup.id,
  });

  return c.html(
    <Fragment>
      {selectUserGroup.map((userGroup, index) => {
        return (
          <tr key={opt.kode_opt}>
            <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              {index + 1}
            </td>
            <td class="border-b border-gray-200 px-4 py-2">
              {userGroup.group_name}
            </td>
          </tr>
        );
      })}
    </Fragment>
  );
});

const lokasiRoute = master.route('/lokasi');

lokasiRoute.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;
  const { page, per_page, alamat } = c.req.query();

  const selectedUser = await db.query.user
    .findFirst({
      where: (user, { eq }) => eq(user.id, parseInt(userId)),
    })
    .catch((err) => {
      console.error(err);
    });

  const lokasiDataQuery = db
    .select({
      id: lokasi.id,
      alamat: lokasi.alamat,
      kode_post: lokasi.kode_post,
      provinsi_id: lokasi.provinsi_id,
      kabkot_id: lokasi.kabkot_id,
      kecamatan_id: lokasi.kecamatan_id,
      desa_id: lokasi.desa_id,
      pic_id: lokasi.pic_id,
      provinsi: provinsi,
      kabupaten_kota: kabupatenKota,
      kecamatan: kecamatan,
      desa: desa,
      pic: user,
    })
    .from(lokasi)
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
    .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
    .leftJoin(desa, eq(desa.id, lokasi.desa_id))
    .leftJoin(user, eq(user.id, lokasi.pic_id))
    .where(and(!!alamat ? ilike(lokasi.alamat, `%${alamat}%`) : undefined))
    .$dynamic();

  const lokasiData = await withPagination(
    lokasiDataQuery,
    parseInt(page || '1'),
    parseInt(per_page || '25')
  );

  console.log(page);

  if (c.req.header('hx-request') && c.req.header('hx-target') == 'table-body') {
    return c.html(
      <Fragment>
        {lokasiData.map((row, index) => {
          return (
            <tr class="grid grid-cols-8">
              {lokasiColumn.map((col) => {
                return (
                  <td class="border-r border-t border-gray-200 px-2 py-1">
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
        'HX-Push-Url': c.req.url,
      }
    );
  }

  return c.html(
    <DefaultLayout
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
      route="lokasi"
    >
      <LokasiPage
        user={!!selectedUser ? selectedUser : null}
        lokasiList={lokasiData}
      />
    </DefaultLayout>
  );
});
lokasiRoute.get('/create', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const selectedUser = await db.query.user
    .findFirst({
      where: (user, { eq }) => eq(user.id, parseInt(userId)),
    })
    .catch((err) => {
      console.error(err);
    });
  return c.html(
    <DefaultLayout
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
      route="lokasi"
    >
      <ModalLokasi />
    </DefaultLayout>
  );
});

const kabkotRoute = master.route('/kabkot');
kabkotRoute.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const selectUser = await db.query.user
    .findFirst({
      columns: {
        password: false,
      },
      with: {
        userGroup: true,
      },
      where: (user, { eq }) => eq(user.id, parseInt(userId)),
    })
    .catch((err) => {
      console.error(err);
    });

  const dataKabKot = await db.query.kabupatenKota.findMany({
    columns: {
      point_kabkot: false,
      area_kabkot: false,
    },
    with: {
      provinsi: true,
    },
    orderBy: (kabkot, { asc }) => asc(kabkot.id),
  });

  return c.html(
    <DefaultLayout
      route="kabupaten-kota"
      authNavigation={!!selectUser ? <Profile user={selectUser} /> : null}
    >
      <KabupatenKotaPage kabkotList={dataKabKot} />
    </DefaultLayout>
  );
});
kabkotRoute.post(
  '/',
  authorizeWebInput,
  validator('form', (value) => value),
  async (c) => {
    const body = await c.req.formData();
    const geom = body.get('geom');
    const id = body.get('id') as string;
    const nama_kabkot = body.get('nama_kabkot') as string;

    const geomData = await (geom as Blob).json();
    await db.insert(kabupatenKota).values({
      id,
      nama_kabkot,
      provinsi_id: '32',
      area_kabkot: sql`ST_GeomFromGeoJSON(${JSON.stringify(geomData.features[0].geometry)})`,
      point_kabkot: [
        geomData.features[0].properties.longitude,
        geomData.features[0].properties.latitude,
      ],
    });

    return c.text('hello world', 200, {
      'HX-Reswap': 'none',
    });
  }
);

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
