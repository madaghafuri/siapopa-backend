import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../index.js';
import { and, eq, ilike, sql } from 'drizzle-orm';
import { user } from '../../db/schema/user.js';
import { DefaultLayout } from '../layouts/default-layout.js';
import Profile, { AuthenticatedUser } from '../components/profile.js';
import { InsertTanaman, tanaman } from '../../db/schema/tanaman.js';
import { InsertOPT, opt } from '../../db/schema/opt.js';
import { lokasi } from '../../db/schema/lokasi.js';
import { provinsi } from '../../db/schema/provinsi.js';
import { kabupatenKota } from '../../db/schema/kabupaten-kota.js';
import { kecamatan } from '../../db/schema/kecamatan.js';
import { desa } from '../../db/schema/desa.js';
import DataStockPestisida, {
  stockPestisidaColumn,
} from '../pages/stock/stock-pestisida.js';
import { InsertPestisida, pestisida } from '../../db/schema/pestisida.js';
import {
  golonganPestisida,
  InsertGolonganPestisida,
} from '../../db/schema/golongan-pestisida.js';
import DataGolonganPestisida from '../pages/stock/golongan-pestisida.js';
import DataBahanAktif from '../pages/stock/bahan-aktif.js';
import { bahanAktif, InsertBahanAktif } from '../../db/schema/bahan-aktif.js';
import { ModalBahanAktif } from '../components/stock/modal-bahan-aktif.js';
import { authorizeStockInput } from '../../middleware.js';
import { validator } from 'hono/validator';
import { Fragment } from 'hono/jsx/jsx-runtime';
import { ModalGolonganPestisida } from '../components/stock/modal-golongan-pestisida.js';
import { ModalStockPestisida } from '../components/stock/modal-stock-pestisida.js';
import { Table } from '../components/table.js';
import { html } from 'hono/html';

export const stock = new Hono<{
  Variables: {
    session: Session;
    session_key_rotation: boolean;
  };
}>();
stock.get('/stock-pestisida', async (c) => {
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
      id: pestisida.id,
      satuan: pestisida.satuan,
      nama_opt: opt.nama_opt,
      nama_tanaman: tanaman.nama_tanaman,
      volume: pestisida.volume,
      merk_dagang: pestisida.merk_dagang,
      periode_bulan: pestisida.periode_bulan,
      tahun_pengadaan: pestisida.tahun_pengadaan,
      bahanAktif: bahanAktif.nama_bahan,
      expired_date: pestisida.expired_date,
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
    .leftJoin(bahanAktif, eq(bahanAktif.id, pestisida.bahan_aktif_id))
    .leftJoin(
      golonganPestisida,
      eq(golonganPestisida.id, pestisida.golongan_pestisida_id)
    );

  if (c.req.header('hx-request')) {
    return c.html(
      <Fragment>
        <Table
          columns={stockPestisidaColumn}
          rowsData={selectStockPestisida}
          className="hover display nowrap max-w-full rounded-md bg-white"
          id="stockPestisidaTable"
        />
        {html`
          <script>
            $(document).ready(function () {
              $('#stockPestisidaTable').DataTable({ scrollX: true });
            });
          </script>
        `}
      </Fragment>
    );
  }

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

stock.get('/stock-pestisida/create', async (c) => {
  const selectGolonganPestisida = await db.select().from(golonganPestisida);
  const selectBahanAktif = await db.select().from(bahanAktif);
  const selectOPT = await db.select().from(opt);
  const selectTanaman = await db.select().from(tanaman);
  const selectProvinsi = await db.query.provinsi.findMany({
    columns: {
      point_provinsi: false,
      area_provinsi: false,
    },
  });
  const selectKabKot = await db.query.kabupatenKota.findMany({
    columns: {
      area_kabkot: false,
      point_kabkot: false,
    },
  });
  const selectKecamatan = await db.query.kecamatan.findMany({
    columns: {
      point_kecamatan: false,
      area_kecamatan: false,
    },
  });
  const selectDesa = await db.query.desa.findMany({
    columns: {
      point_desa: false,
      area_desa: false,
    },
  });

  return c.html(
    <ModalStockPestisida
      listGolongan={selectGolonganPestisida}
      listBahanAktif={selectBahanAktif}
      listOpt={selectOPT}
      listTanaman={selectTanaman}
      listProvinsi={selectProvinsi}
      listKabKot={selectKabKot}
      listKecamatan={selectKecamatan}
      listDesa={selectDesa}
    />
  );
});
stock.post(
  '/stock-pestisida',
  authorizeStockInput,
  validator('form', (value, c) => {
    const {
      tanaman_id,
      lokasi_id,
      satuan,
      opt_id,
      bahan_aktif_id,
      merk_dagang,
      volume,
      periode_bulan,
      tahun_pengadaan,
      golongan_pestisida_id,
      expired_date,
    } = value as unknown as InsertPestisida;

    if (
      !tanaman_id ||
      !lokasi_id ||
      !satuan ||
      !opt_id ||
      !bahan_aktif_id ||
      !merk_dagang ||
      !merk_dagang ||
      !volume ||
      !periode_bulan ||
      !tahun_pengadaan ||
      !golongan_pestisida_id ||
      !expired_date
    ) {
      return c.html(
        <span class="text-sm text-red-500">
          Data yang dibutuhkan tidak sesuai
        </span>
      );
    }

    return {
      tanaman_id,
      lokasi_id,
      satuan,
      opt_id,
      bahan_aktif_id,
      merk_dagang,
      volume,
      periode_bulan,
      tahun_pengadaan,
      golongan_pestisida_id,
    };
  }),
  async (c) => {
    const pestisidaData = c.req.valid('form');

    try {
      await db.insert(pestisida).values({ ...pestisidaData });
    } catch (error) {
      console.error('Error during insertion:', error);
      return c.html(
        <span>
          Terjadi kesalahan dalam proses pengmasteran data. Silahkan coba lagi
        </span>,
        500
      );
    }

    return c.html(<span>Berhasil menambahkan data</span>, 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newPestisida, closeModal',
    });
  }
);
stock.get('/stock-pestisida/reload', async (c) => {
  const selectPestisida = await db
    .select()
    .from(pestisida)
    .orderBy(pestisida.id);
  return c.html(
    <Fragment>
      {selectPestisida.map((pestisida, index) => {
        return (
          <tr key={pestisida.id}>
            <td class="border-b border-gray-200 px-4 py-2">{index + 1}</td>
            <td class="border-b border-gray-200 px-4 py-2">
              {pestisida.merk_dagang}
            </td>
            <td class="border-b border-gray-200 px-4 py-2">
              <div class="flex items-center space-x-2">
                <button
                  class="px-4 text-blue-500 hover:text-blue-700"
                  hx-get={`/app/stock/golongan-pestisida/edit/${pestisida.id}`}
                  hx-target="body"
                  hx-swap="beforeend"
                >
                  <i class="fa fa-edit"></i>
                </button>
                <button
                  class="ml-2 px-4 text-red-500 hover:text-red-700"
                  hx-delete={`/app/stock/golongan-pestisida/delete/${pestisida.id}`}
                  hx-target="#bahanAktifTable"
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
stock.delete('/stock-pestisida/delete/:id', async (c) => {
  const id = c.req.param('id');

  try {
    await db.delete(pestisida).where(eq(pestisida.id, parseInt(id)));
  } catch (error) {
    return c.html(
      <span>
        Terjadi kesalahan dalam proses penghapusan data. Silahkan coba lagi
      </span>,
      500
    );
  }

  return c.html(<span>Berhasil menghapus data</span>, 200, {
    'HX-Reswap': 'none',
    'HX-Trigger': 'newPestisida',
  });
});

stock.get('/stock-pestisida/edit/:id', async (c) => {
  const id = c.req.param('id');
  const pestisidaItem = await db
    .select()
    .from(pestisida)
    .where(eq(pestisida.id, parseInt(id)));
  const selectGolonganPestisida = await db.select().from(golonganPestisida);
  const selectBahanAktif = await db.select().from(bahanAktif);
  const selectOPT = await db.select().from(opt);
  const selectTanaman = await db.select().from(tanaman);
  const selectProvinsi = await db.select().from(provinsi);
  const selectKabKot = await db.select().from(kabupatenKota);
  const selectKecamatan = await db.select().from(kecamatan);
  const selectDesa = await db.select().from(desa);

  return c.html(
    <ModalStockPestisida
      listGolongan={selectGolonganPestisida}
      listBahanAktif={selectBahanAktif}
      listOpt={selectOPT}
      listTanaman={selectTanaman}
      listProvinsi={selectProvinsi}
      listKabKot={selectKabKot}
      listKecamatan={selectKecamatan}
      listDesa={selectDesa}
      pestisida={pestisidaItem[0]}
    />
  );
});

stock.post(
  '/golongan-pestisida/edit/:id',
  authorizeStockInput,
  validator('form', (value, c) => {
    const { nama_golongan } = value as unknown as InsertGolonganPestisida;

    if (!nama_golongan) {
      return c.html(
        <span class="text-sm text-red-500">
          Data yang dibutuhkan tidak sesuai
        </span>
      );
    }

    return { nama_golongan };
  }),
  async (c) => {
    const id = c.req.param('id');
    const golonganPestisidaData = c.req.valid('form');

    try {
      await db
        .update(golonganPestisida)
        .set(golonganPestisidaData)
        .where(eq(golonganPestisida.id, parseInt(id)));
    } catch (error) {
      return c.html(
        <span>
          Terjadi kesalahan dalam proses pengeditan data. Silahkan coba lagi
        </span>,
        500
      );
    }

    return c.html(<span>Berhasil mengedit data</span>, 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newGolonganPestisida, closeModal',
    });
  }
);

stock.get('/golongan-pestisida', async (c) => {
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
stock.get('/golongan-pestisida/create', async (c) => {
  return c.html(<ModalGolonganPestisida />);
});

stock.post(
  '/golongan-pestisida',
  authorizeStockInput,
  validator('form', (value, c) => {
    const { nama_golongan } = value as unknown as InsertGolonganPestisida;

    if (!nama_golongan) {
      return c.html(
        <span class="text-sm text-red-500">
          Data yang dibutuhkan tidak sesuai
        </span>
      );
    }

    return { nama_golongan };
  }),
  async (c) => {
    const golonganPestisidaData = c.req.valid('form');

    try {
      await db.insert(golonganPestisida).values({ ...golonganPestisidaData });
    } catch (error) {
      console.error('Error during insertion:', error);
      return c.html(
        <span>
          Terjadi kesalahan dalam proses pengmasteran data. Silahkan coba lagi
        </span>,
        500
      );
    }

    return c.html(<span>Berhasil menambahkan data</span>, 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newGolonganPestisida, closeModal',
    });
  }
);
stock.get('/golongan-pestisida/reload', async (c) => {
  const selectGolonganPestisida = await db
    .select()
    .from(golonganPestisida)
    .orderBy(golonganPestisida.id);
  return c.html(
    <Fragment>
      {selectGolonganPestisida.map((golonganPestisida, index) => {
        return (
          <tr key={golonganPestisida.id}>
            <td class="border-b border-gray-200 px-4 py-2">{index + 1}</td>
            <td class="border-b border-gray-200 px-4 py-2">
              {golonganPestisida.nama_golongan}
            </td>
            <td class="border-b border-gray-200 px-4 py-2">
              <div class="flex items-center space-x-2">
                <button
                  class="px-4 text-blue-500 hover:text-blue-700"
                  hx-get={`/app/stock/golongan-pestisida/edit/${golonganPestisida.id}`}
                  hx-target="body"
                  hx-swap="beforeend"
                >
                  <i class="fa fa-edit"></i>
                </button>
                <button
                  class="ml-2 px-4 text-red-500 hover:text-red-700"
                  hx-delete={`/app/stock/golongan-pestisida/delete/${golonganPestisida.id}`}
                  hx-target="#bahanAktifTable"
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

stock.delete('/golongan-pestisida/delete/:id', async (c) => {
  const id = c.req.param('id');

  try {
    await db
      .delete(golonganPestisida)
      .where(eq(golonganPestisida.id, parseInt(id)));
  } catch (error) {
    return c.html(
      <span>
        Terjadi kesalahan dalam proses penghapusan data. Silahkan coba lagi
      </span>,
      500
    );
  }

  return c.html(<span>Berhasil menghapus data</span>, 200, {
    'HX-Reswap': 'none',
    'HX-Trigger': 'newGolonganPestisida',
  });
});

stock.get('/golongan-pestisida/edit/:id', async (c) => {
  const id = c.req.param('id');
  const golonganPestisidaItem = await db
    .select()
    .from(golonganPestisida)
    .where(eq(golonganPestisida.id, parseInt(id)));

  return c.html(
    <ModalGolonganPestisida golonganPestisida={golonganPestisidaItem[0]} />
  );
});

stock.post(
  '/golongan-pestisida/edit/:id',
  authorizeStockInput,
  validator('form', (value, c) => {
    const { nama_golongan } = value as unknown as InsertGolonganPestisida;

    if (!nama_golongan) {
      return c.html(
        <span class="text-sm text-red-500">
          Data yang dibutuhkan tidak sesuai
        </span>
      );
    }

    return { nama_golongan };
  }),
  async (c) => {
    const id = c.req.param('id');
    const golonganPestisidaData = c.req.valid('form');

    try {
      await db
        .update(golonganPestisida)
        .set(golonganPestisidaData)
        .where(eq(golonganPestisida.id, parseInt(id)));
    } catch (error) {
      return c.html(
        <span>
          Terjadi kesalahan dalam proses pengeditan data. Silahkan coba lagi
        </span>,
        500
      );
    }

    return c.html(<span>Berhasil mengedit data</span>, 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newGolonganPestisida, closeModal',
    });
  }
);

stock.get('/bahan-aktif', async (c) => {
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

  const selectBahanAktif = await db.select().from(bahanAktif);

  return c.html(
    <DefaultLayout
      route="bahan-aktif"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
    >
      <DataBahanAktif
        listBahanAktif={selectBahanAktif}
        user={selectedUser || null}
      />
    </DefaultLayout>
  );
});

stock.get('/bahan-aktif/create', async (c) => {
  return c.html(<ModalBahanAktif />);
});

stock.post(
  '/bahan-aktif',
  authorizeStockInput,
  validator('form', (value, c) => {
    const { nama_bahan } = value as unknown as InsertBahanAktif;

    if (!nama_bahan) {
      return c.html(
        <span class="text-sm text-red-500">
          Data yang dibutuhkan tidak sesuai
        </span>
      );
    }

    return { nama_bahan };
  }),
  async (c) => {
    const bahanAktifData = c.req.valid('form');

    try {
      await db.insert(bahanAktif).values({ ...bahanAktifData });
    } catch (error) {
      console.error('Error during insertion:', error);
      return c.html(
        <span>
          Terjadi kesalahan dalam proses pengmasteran data. Silahkan coba lagi
        </span>,
        500
      );
    }

    return c.html(<span>Berhasil menambahkan data</span>, 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newBahanAktif, closeModal',
    });
  }
);
stock.get('/bahan-aktif/reload', async (c) => {
  const selectBahanAktif = await db
    .select()
    .from(bahanAktif)
    .orderBy(bahanAktif.id);
  return c.html(
    <Fragment>
      {selectBahanAktif.map((bahanAktif, index) => {
        return (
          <tr key={bahanAktif.id}>
            <td class="border-b border-gray-200 px-4 py-2">{index + 1}</td>
            <td class="border-b border-gray-200 px-4 py-2">
              {bahanAktif.nama_bahan}
            </td>
            <td class="border-b border-gray-200 px-4 py-2">
              <div class="flex items-center space-x-2">
                <button
                  class="px-4 text-blue-500 hover:text-blue-700"
                  hx-get={`/app/stock/bahan-aktif/edit/${bahanAktif.id}`}
                  hx-target="body"
                  hx-swap="beforeend"
                >
                  <i class="fa fa-edit"></i>
                </button>
                <button
                  class="ml-2 px-4 text-red-500 hover:text-red-700"
                  hx-delete={`/app/stock/bahan-aktif/delete/${bahanAktif.id}`}
                  hx-target="#bahanAktifTable"
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

stock.delete('/bahan-aktif/delete/:id', async (c) => {
  const id = c.req.param('id');

  try {
    await db.delete(bahanAktif).where(eq(bahanAktif.id, parseInt(id)));
  } catch (error) {
    return c.html(
      <span>
        Terjadi kesalahan dalam proses penghapusan data. Silahkan coba lagi
      </span>,
      500
    );
  }

  return c.html(<span>Berhasil menghapus data</span>, 200, {
    'HX-Reswap': 'none',
    'HX-Trigger': 'newBahanAktif',
  });
});

stock.get('/bahan-aktif/edit/:id', async (c) => {
  const id = c.req.param('id');
  const bahanAktifItem = await db
    .select()
    .from(bahanAktif)
    .where(eq(bahanAktif.id, parseInt(id)));

  return c.html(<ModalBahanAktif bahanAktif={bahanAktifItem[0]} />);
});

stock.post(
  '/bahan-aktif/edit/:id',
  authorizeStockInput,
  validator('form', (value, c) => {
    const { nama_bahan } = value as unknown as InsertBahanAktif;

    if (!nama_bahan) {
      return c.html(
        <span class="text-sm text-red-500">
          Data yang dibutuhkan tidak sesuai
        </span>
      );
    }

    return { nama_bahan };
  }),
  async (c) => {
    const id = c.req.param('id');
    const bahanAktifData = c.req.valid('form');

    try {
      await db
        .update(bahanAktif)
        .set(bahanAktifData)
        .where(eq(bahanAktif.id, parseInt(id)));
    } catch (error) {
      return c.html(
        <span>
          Terjadi kesalahan dalam proses pengeditan data. Silahkan coba lagi
        </span>,
        500
      );
    }

    return c.html(<span>Berhasil mengedit data</span>, 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newBahanAktif, closeModal',
    });
  }
);
