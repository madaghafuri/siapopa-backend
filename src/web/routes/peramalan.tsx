import { Hono } from 'hono';
import { DefaultLayout } from '../layouts/default-layout';
import { Session } from 'hono-sessions';
import { SelectUser } from '../../db/schema/user';
import { Lokasi } from '../../db/schema/lokasi';
import { SelectUserGroup } from '../../db/schema/user-group';
import Profile from '../components/profile';
import {
  columnHeaderPeramalanKecamatan,
  PeramalanKecamatan,
} from '../pages/peramalan/peramalan-kecamatan';
import { db } from '../..';
import {} from 'hono/jsx/jsx-runtime';
import {
  InsertPeramalanKecamatan,
  peramalanKecamatan,
} from '../../db/schema/peramalan-kecamatan';
import { kecamatan } from '../../db/schema/kecamatan';
import { and, asc, eq, sql } from 'drizzle-orm';
import { kabupatenKota } from '../../db/schema/kabupaten-kota';
import { opt } from '../../db/schema/opt';
import Modal, { ModalContent, ModalHeader } from '../components/modal';
import { validator } from 'hono/validator';
import * as XLSX from 'xlsx';

export const peramalanRoute = new Hono<{
  Variables: {
    session: Session;
    user: Omit<SelectUser, 'password'> & {
      locations: Lokasi[];
      userGroup: SelectUserGroup;
    };
  };
}>().basePath('/peramalan');

const peramalanByKecamatan = peramalanRoute.route('/kecamatan');

peramalanByKecamatan.get('/', async (c) => {
  const authenticatedUser = c.get('user');
  const { page, per_page, kabkot_id } = c.req.query();

  const kabkotOptions = await db.query.kabupatenKota.findMany({
    where: (kabkot, { eq }) => eq(kabkot.provinsi_id, '32'),
    columns: {
      id: true,
      nama_kabkot: true,
    },
    orderBy: (kabkot, { asc }) => asc(sql`cast(${kabkot.id} as int)`),
  });

  const dataPeramalanByOPT = await db
    .select({
      opt_id: opt.id,
      kode_opt: opt.kode_opt,
      nama_opt: opt.nama_opt,
      klts_sebelumnya:
        sql<number>`sum(${peramalanKecamatan.klts_sebelumnya})`.as(
          'klts_sebelumnya'
        ),
      klts_antara: sql<number>`sum(${peramalanKecamatan.klts_antara})`.as(
        'klts_antara'
      ),
      klts_prakiraan: sql<number>`sum(${peramalanKecamatan.klts_prakiraan})`.as(
        'klts_prakiraan'
      ),
    })
    .from(peramalanKecamatan)
    .leftJoin(opt, eq(opt.id, peramalanKecamatan.opt_id))
    .leftJoin(kecamatan, eq(kecamatan.id, peramalanKecamatan.kecamatan_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, kecamatan.kabkot_id))
    .groupBy(opt.id, opt.kode_opt, opt.nama_opt)
    .orderBy(asc(opt.id))
    .where(eq(kabupatenKota.id, '3201'))
    .limit(10)
    .offset(0);

  const dataPeramalan = await db
    .select({
      id: peramalanKecamatan.id,
      peramalan_id: peramalanKecamatan.peramalan_id,
      opt_id: peramalanKecamatan.opt_id,
      kecamatan_id: peramalanKecamatan.kecamatan_id,
      mt_sebelumnya: peramalanKecamatan.mt_sebelumnya,
      mt_antara: peramalanKecamatan.mt_antara,
      mt_prakiraan: peramalanKecamatan.mt_prakiraan,
      klts_sebelumnya: peramalanKecamatan.klts_sebelumnya,
      klts_antara: peramalanKecamatan.klts_antara,
      klts_prakiraan: peramalanKecamatan.klts_prakiraan,
      proporsi: peramalanKecamatan.proporsi,
      kecamatan: {
        id: kecamatan.id,
        nama_kecamatan: kecamatan.nama_kecamatan,
      },
      opt: opt,
      created_at: peramalanKecamatan.created_at,
      updated_at: peramalanKecamatan.updated_at,
    })
    .from(peramalanKecamatan)
    .leftJoin(kecamatan, eq(kecamatan.id, peramalanKecamatan.kecamatan_id))
    .leftJoin(opt, eq(opt.id, peramalanKecamatan.opt_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, kecamatan.kabkot_id))
    .where(and(!!kabkot_id ? eq(kabupatenKota.id, kabkot_id) : undefined))
    .limit(parseInt(per_page || '10'))
    .offset((parseInt(page || '1') - 1) * parseInt(per_page || '10'));

  if (c.req.header('hx-request')) {
    return c.html(
      <>
        {dataPeramalan.map((row, index) => {
          return (
            <tr class="border-y border-gray-200 even:bg-zinc-100 hover:bg-zinc-100">
              {columnHeaderPeramalanKecamatan.map((col) => {
                return (
                  <td class="p-2" style="white-space: nowrap;">
                    {col.valueGetter?.(row, index) || row[col.field]}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </>
    );
  }

  return c.html(
    <DefaultLayout
      route="peramalan"
      authNavigation={<Profile user={authenticatedUser}></Profile>}
      user={authenticatedUser}
    >
      <PeramalanKecamatan
        dataPeramalanOPT={dataPeramalanByOPT}
        dataPeramalan={dataPeramalan}
        kabkotOptions={kabkotOptions}
      />
    </DefaultLayout>
  );
});
peramalanByKecamatan.get('/create', async (c) => {
  const kabkotOptions = await db.query.kabupatenKota.findMany({
    where: (kabkot, { eq }) => eq(kabkot.provinsi_id, '32'),
    columns: {
      id: true,
      nama_kabkot: true,
    },
    orderBy: (kabkot, { asc }) => asc(sql`cast(${kabkot.id} as int)`),
  });

  const tanamanOptions = await db.query.tanaman.findMany({
    limit: 100,
  });

  return c.html(
    <Modal>
      <ModalHeader>Tambah Peramalan Kecamatan</ModalHeader>
      <ModalContent>
        <form
          hx-encoding="multipart/form-data"
          hx-post="/app/peramalan/kecamatan"
          hx-trigger="submit"
          hx-indicator="#loading"
          hx-target="#error-message"
          hx-swap="innerHTML"
          class="grid grid-cols-2 gap-3"
        >
          <div class="flex flex-col gap-1">
            <label class="text-sm text-indigo-800">
              Kabupaten / Kota <span class="text-sm text-red-500">*</span>
            </label>
            <select
              id="kabkot-options"
              name="kabkot_id"
              class="px-2 py-1"
              required
            >
              {kabkotOptions.map((val) => {
                return <option value={val.id}>{val.nama_kabkot}</option>;
              })}
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm text-indigo-800">
              Tanaman <span class="text-sm text-red-500">*</span>
            </label>
            <select name="tanaman_id" class="px-2 py-1" required>
              {tanamanOptions.map((val) => {
                return <option value={val.id}>{val.nama_tanaman}</option>;
              })}
            </select>
          </div>

          <div class="col-span-2 flex flex-col gap-1">
            <label class="text-sm text-indigo-800">
              Kabupaten / Kota <span class="text-sm text-red-500">*</span>
            </label>
            <input
              type="file"
              name="file"
              required
              accept=".xls,.xlsx,.csv,.ods,.numbers"
            />
          </div>
          <div class="text-sm text-red-500" id="error-message"></div>
          <button
            type="submit"
            class="col-span-2 mt-3 rounded bg-primary px-2 py-1 text-white"
          >
            <div id="loading">
              <p>Tambah Peramalan Kecamatan</p>
              <i class="fa-solid fa-spinner"></i>
            </div>
          </button>
        </form>
      </ModalContent>
    </Modal>
  );
});

const allowedTypes = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/x-iwork-numbers-sffnumbers',
];

peramalanByKecamatan.post(
  '/',
  validator('form', (value, c) => {
    const { file, kabkot_id, tanaman_id } = value as {
      file: File;
      kabkot_id: string;
      tanaman_id: string;
    };
    if (!file || !kabkot_id || !tanaman_id) {
      return c.html(<span>Data yang dimasukkan tidak lengkap</span>);
    }

    if (!allowedTypes.includes(file.type)) {
      return c.html(<span>File yang diunggah tidak valid</span>);
    }

    return { file, kabkot_id, tanaman_id } as {
      file: File;
      kabkot_id: string;
      tanaman_id: string;
    };
  }),
  async (c) => {
    const { file, kabkot_id, tanaman_id } = c.req.valid('form');
    const fileBuffer = await file.arrayBuffer();

    const workbook = XLSX.read(fileBuffer);
    const worksheet = workbook.SheetNames;
    const foo = workbook.Sheets[worksheet[0]];
    const raw_data = XLSX.utils.sheet_to_json(foo, { header: 'A' });

    const dataToInsert: InsertPeramalanKecamatan[] = [];

    const kecamatanList = await db.query.kecamatan.findMany({
      columns: {
        id: true,
        nama_kecamatan: true,
      },
      where: (kecamatan, { eq }) => eq(kecamatan.kabkot_id, kabkot_id),
    });

    const optList = await db.query.opt.findMany({
      where: (opt, { and, eq }) =>
        and(eq(opt.tanaman_id, parseInt(tanaman_id)), eq(opt.jenis, 'opt')),
    });

    raw_data.forEach((val) => {
      /**
       * A: No
       * B: Kecamatan
       * C: Kode OPT
       */
      if (
        !('A' in (val as object)) ||
        !('B' in (val as object)) ||
        val['B'] == 'Kecamatan'
      )
        return;
      const kecamatanToFind = kecamatanList.find(
        (kecval) =>
          kecval.nama_kecamatan.replace(/\s/g, '') ==
          val['B'].replace(/\s/g, '').toUpperCase()
      );
      const optToFind = optList.find((optval) => optval.kode_opt === val['C']);
      const tempData: InsertPeramalanKecamatan = {
        opt_id: optToFind.id || null,
        kecamatan_id: kecamatanToFind?.id || null,
        klts_sebelumnya: val['D'],
        klts_antara: val['E'],
        proporsi: val['F'],
        klts_prakiraan: isNaN(val['G'])
          ? 0
          : !!val['G']
            ? Math.round(val['G'])
            : 0,
        mt_sebelumnya: 2023,
        mt_antara: '2022/2023',
        mt_prakiraan: 2024,
      };
      dataToInsert.push(tempData);
    });

    try {
      await db.insert(peramalanKecamatan).values(dataToInsert);
    } catch (error) {
      console.error(error);
      return c.html(<span>Terjadi kesalahan dalam penginputan data</span>);
    }

    return c.text('Success', 200, {
      'HX-Reswap': 'none',
      'HX-Trigger': 'newPrakiraanKecamatan, closeModal',
    });
  }
);
