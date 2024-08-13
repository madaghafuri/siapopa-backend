import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { db } from '../../..';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { lokasi } from '../../../db/schema/lokasi';
import { stockAphColumn, StockAphPage } from '../../pages/stock/stock-aph';
import { Fragment } from 'hono/jsx/jsx-runtime';
import { InsertStockAph, stockAph } from '../../../db/schema/stock-aph';
import { kabupatenKota } from '../../../db/schema/kabupaten-kota';
import { user } from '../../../db/schema/user';
import { golonganAph } from '../../../db/schema/golongan-aph';
import { bentukStockAph } from '../../../db/schema/bentuk-stok-aph';
import { provinsi } from '../../../db/schema/provinsi';
import { kecamatan } from '../../../db/schema/kecamatan';
import { desa } from '../../../db/schema/desa';
import Modal, { ModalContent, ModalHeader } from '../../components/modal';
import { html } from 'hono/html';
import { validator } from 'hono/validator';
import { userGroup } from '../../../db/schema/user-group';
import { getRelatedLocationsByUser } from '../../../helper';

export const stockAphRoute = new Hono<{
  Variables: { session: Session };
}>().basePath('/aph');

stockAphRoute.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;
  const { kabkot_id, page, per_page } = c.req.query();

  const selectUser = await db.query.user.findFirst({
    with: {
      userGroup: true,
      locations: true,
    },
    where: (user, { eq }) => eq(user.id, parseInt(userId)),
  });

  const assignedLocations = await getRelatedLocationsByUser(selectUser);
  console.log(assignedLocations);

  const kabkotOptions = await db.query.kabupatenKota.findMany({
    columns: {
      area_kabkot: false,
      point_kabkot: false,
    },
    where: (kabkot, { inArray, and }) =>
      and(
        selectUser.userGroup.group_name === 'satpel'
          ? inArray(
              kabkot.id,
              assignedLocations.map((val) => val.kabkot_id)
            )
          : undefined
      ),
    orderBy: (kabkot, { asc }) => asc(sql`cast(${kabkot.id} as numeric)`),
  });

  const selectStockAph = await db
    .select({
      id: stockAph.id,
      tahun_pelaksanaan: stockAph.tahun_pelaksanaan,
      bulan_pelaksanaan: stockAph.bulan_pelaksanaan,
      jenis: stockAph.jenis,
      lokasi_id: stockAph.lokasi_id,
      golongan_aph_id: stockAph.golongan_aph_id,
      bentuk_aph_id: stockAph.bentuk_aph_id,
      sisa_volume: stockAph.sisa_volume,
      volume_produksi: stockAph.volume_produksi,
      tanggal_produksi: stockAph.tanggal_produksi,
      volume_distribusi: stockAph.volume_distribusi,
      tanggal_distribusi: stockAph.tanggal_distribusi,
      keterangan_kegiatan: stockAph.keterangan_kegiatan,
      tanggal_expired: stockAph.tanggal_expired,
      satpel_id: stockAph.satpel_id,
      golongan_aph: golonganAph,
      satpel: user,
      bentuk_aph: bentukStockAph,
      lokasi: {
        ...lokasi,
        provinsi: {
          id: provinsi.id,
          nama_provinsi: provinsi.nama_provinsi,
        },
        kabupaten_kota: {
          id: kabupatenKota.id,
          nama_kabkot: kabupatenKota.nama_kabkot,
        },
        kecamatan: {
          id: kecamatan.id,
          nama_kecamatan: kecamatan.nama_kecamatan,
        },
        desa: {
          id: desa.id,
          nama_desa: desa.nama_desa,
        },
      },
    })
    .from(stockAph)
    .leftJoin(lokasi, eq(lokasi.id, stockAph.lokasi_id))
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
    .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
    .leftJoin(desa, eq(desa.id, lokasi.desa_id))
    .leftJoin(user, eq(stockAph.satpel_id, user.id))
    .leftJoin(golonganAph, eq(golonganAph.id, stockAph.golongan_aph_id))
    .leftJoin(bentukStockAph, eq(bentukStockAph.id, stockAph.bentuk_aph_id))
    .where(
      and(
        !!kabkot_id ? eq(lokasi.kabkot_id, kabkot_id) : undefined,
        selectUser.userGroup.group_name === 'satpel'
          ? inArray(
              stockAph.lokasi_id,
              assignedLocations.map((val) => val.id)
            )
          : undefined
      )
    )
    .limit(parseInt(per_page || '10'))
    .offset((parseInt(page || '1') - 1) * parseInt(per_page || '10'));

  const newUrl = new URLSearchParams(c.req.query());

  if (c.req.header('hx-request')) {
    return c.html(
      <Fragment>
        {selectStockAph.length > 0 ? (
          selectStockAph.map((row, index) => {
            return (
              <tr class="border-y border-gray-200 hover:bg-zinc-100">
                {stockAphColumn.map((col) => {
                  return (
                    <td class="p-3" style="white-space: nowrap;">
                      {col.valueGetter?.(row, index) || row[col.field]}
                    </td>
                  );
                })}
              </tr>
            );
          })
        ) : (
          <tr>
            <td colspan={100} class="p-2 text-center">
              No data available
            </td>
          </tr>
        )}
      </Fragment>,
      200,
      {
        'HX-Push-Url': '/app/stock/aph?' + newUrl.toString(),
      }
    );
  }

  return c.html(
    <DefaultLayout
      route="stock-aph"
      authNavigation={!!selectUser ? <Profile user={selectUser} /> : null}
      user={selectUser || null}
    >
      <StockAphPage
        stockAphList={selectStockAph}
        kabkotOptions={kabkotOptions}
      />
    </DefaultLayout>
  );
});
stockAphRoute.get('/create', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  const selectUser = await db.query.user.findFirst({
    with: {
      locations: true,
      userGroup: true,
    },
    where: (user, { eq }) => eq(user.id, parseInt(userId)),
  });

  const assignedLocations = await getRelatedLocationsByUser(selectUser);

  const lokasiOptions = await db.query.lokasi.findMany({
    with: {
      provinsi: {
        columns: {
          area_provinsi: false,
          point_provinsi: false,
        },
      },
      kabupaten_kota: {
        columns: {
          area_kabkot: false,
          point_kabkot: false,
        },
      },
      kecamatan: {
        columns: {
          area_kecamatan: false,
          point_kecamatan: false,
        },
      },
      desa: {
        columns: {
          area_desa: false,
          point_desa: false,
        },
      },
    },
    where: (lokasi, { inArray }) =>
      selectUser.userGroup.group_name === 'satpel'
        ? inArray(
            lokasi.id,
            assignedLocations.map((val) => val.id)
          )
        : undefined,
  });

  const satpelOptions = await db
    .select()
    .from(user)
    .leftJoin(userGroup, eq(userGroup.id, user.usergroup_id))
    .where(eq(userGroup.group_name, 'satpel'));

  const golonganAphOptions = await db.query.golonganAph.findMany({
    limit: 50,
    offset: 0,
  });

  const bentukAphOptions = await db.query.bentukStockAph.findMany({
    limit: 50,
    offset: 0,
  });

  return c.html(
    <Modal>
      <ModalHeader>Buat Stock APH</ModalHeader>
      <ModalContent>
        <form
          class="grid grid-cols-2 gap-3"
          hx-post="/app/stock/aph"
          hx-trigger="submit"
        >
          <div class="flex flex-col gap-1">
            <label class="text-sm text-blue-700">Satpel</label>
            <select
              id="satpel-options"
              name="satpel_id"
              class={`rounded border border-gray-200 px-2 py-1`}
            >
              {selectUser.userGroup.group_name === 'satpel' ? (
                <option value={selectUser.id} selected>
                  {selectUser.name}
                </option>
              ) : (
                <Fragment>
                  <option value="">Pilih Satpel</option>
                  {satpelOptions.map((val) => (
                    <option value={val.users.id}>{val.users.name}</option>
                  ))}
                </Fragment>
              )}
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-blue-700">
              Bulan-Tahun <span class="text-red-500">*</span>
            </label>
            <input
              type="month"
              required
              name="bulan_tahun_pelaksanaan"
              class="rounded border border-gray-200 px-2 py-1"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-blue-700">
              Lokasi <span class="text-red-500">*</span>
            </label>
            <select
              id="lokasi-options"
              type="month"
              name="lokasi_id"
              class="rounded border border-gray-200 px-2 py-1"
            >
              <option value="">Pilih Lokasi</option>
              {lokasiOptions.map((val) => (
                <option value={val.id}>{val.alamat}</option>
              ))}
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-blue-700">
              Jenis <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              name="jenis"
              class="rounded border border-gray-200 px-2 py-1"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-blue-700">
              Golongan <span class="text-sm text-red-500">*</span>
            </label>
            <select
              id="golongan-options"
              type="month"
              name="golongan_aph_id"
              class="rounded border border-gray-200 px-2 py-1 uppercase"
            >
              <option value="">Pilih Golongan</option>
              {golonganAphOptions.map((val) => (
                <option style="text-transform: uppercase;" value={val.id}>
                  {val.jenis}
                </option>
              ))}
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-blue-700">
              Bentuk <span class="text-red-500">*</span>
            </label>
            <select
              id="bentuk-options"
              name="bentuk_aph_id"
              type="month"
              class="rounded border border-gray-200 px-2 py-1"
            >
              <option value="">Pilih Bentuk</option>
              {bentukAphOptions.map((val) => (
                <option value={val.id}>
                  {val.bentuk} {`(${val.satuan})`}
                </option>
              ))}
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-blue-700">
              Volume Sisa <span class="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="sisa_volume"
              required
              class="rounded border border-gray-200 px-2 py-1"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-blue-700">
              Volume Produksi <span class="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="volume_produksi"
              required
              class="rounded border border-gray-200 px-2 py-1"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-blue-700">
              Tanggal Produksi <span class="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              name="tanggal_produksi"
              class="rounded border border-gray-200 px-2 py-1"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-blue-700">
              Volume Distribusi <span class="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="volume_distribusi"
              required
              class="rounded border border-gray-200 px-2 py-1"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-blue-700">
              Tanggal Distribusi <span class="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="tanggal_distribusi"
              required
              class="rounded border border-gray-200 px-2 py-1"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-blue-700">
              Tanggal Expired <span class="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="tanggal_expired"
              required
              class="rounded border border-gray-200 px-2 py-1"
            />
          </div>
          <div class="col-span-2 flex flex-col gap-1">
            <label class="text-sm font-semibold text-blue-700">
              Keterangan Kegiatan
            </label>
            <textarea
              name="keterangan_kegiatan"
              required
              class="rounded border border-gray-200 px-2 py-1"
            />
          </div>
          <button
            class="col-span-2 rounded bg-primary px-2 py-1 text-white"
            hx-indicator="#loading"
          >
            <div id="loading">
              <p>Buat Stock APH</p>
              <i class="fa-solid fa-spinner"></i>
            </div>
          </button>
        </form>
        {html`
          <script>
            $(document).ready(function () {
              function delay(fn, ms) {
                let timer = 0;
                return function (...args) {
                  clearTimeout(timer);
                  timer = setTimeout(fn.bind(this, ...args), ms || 500);
                };
              }
              $('#satpel-options').select2();
              $('#lokasi-options').select2();
              $('#golongan-options').select2();
              $('#bentuk-options').select2();
            });
          </script>
        `}
      </ModalContent>
    </Modal>
  );
});
stockAphRoute.post(
  '/',
  validator('form', (value, c) => {
    const { satpel_id, lokasi_id, bentuk_aph_id, golongan_aph_id } =
      value as InsertStockAph;

    if (!satpel_id || !lokasi_id || !bentuk_aph_id || !golongan_aph_id) {
      return c.html(
        <span class="text-red-500">
          Data yang dibutuhkan tidak lengkap. Silahkan coba lagi
        </span>
      );
    }

    return value as InsertStockAph;
  }),
  async (c) => {
    const { bulan_tahun_pelaksanaan, ...form } = c.req.valid(
      'form'
    ) as InsertStockAph & {
      bulan_tahun_pelaksanaan: string;
    };

    const [tahun, bulan] = bulan_tahun_pelaksanaan.split('-');

    try {
      await db.insert(stockAph).values({
        ...form,
        bulan_pelaksanaan: bulan,
        tahun_pelaksanaan: tahun,
      });
    } catch (error) {
      console.error(error);
      return c.html(
        <span class="text-sm text-red-500">
          Terjadi kesalahan. Silahkan coba lagi
        </span>
      );
    }

    return c.text('Success', 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newAph, closeModal',
    });
  }
);
