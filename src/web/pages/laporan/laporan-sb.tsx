import { html } from 'hono/html';
import { LaporanSb } from '../../../db/schema/laporan-sb.js';
import { ColumnHeader, Table } from '../../components/table.js';
import { SelectTanaman } from '../../../db/schema/tanaman.js';
import { Provinsi } from '../../../db/schema/provinsi.js';
import { LaporanHarian } from '../../../db/schema/laporan-harian.js';
import { columnHeaders } from './laporan-harian.js';
import { LuasKerusakanSb } from '../../../db/schema/luas-kerusakan-sb.js';

export const columnLaporanSb: ColumnHeader<LaporanSb>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  {
    field: 'status_laporan_bulanan',
    headerName: 'status',
    valueGetter: (row) => {
      if (!row.status_laporan_bulanan) {
        return <i class="fa-solid fa-circle-xmark text-red-500"></i>;
      }

      return <i class="fa-solid fa-circle-check text-green-500"></i>;
    },
  },
  { field: 'note', headerName: 'note' },
  {
    field: 'sign_pic',
    headerName: 'signature',
    valueGetter: (row) => (
      <a href={row.sign_pic} target="_blank">
        <img class="h-10 w-10" src={row.sign_pic} alt="" />
      </a>
    ),
  },
  { field: 'tanggal_laporan_sb', headerName: 'tgl laporan' },
  { field: 'luas_sembuh', headerName: 'luas sembuh' },
  { field: 'luas_panen', headerName: 'luas panen' },
  { field: 'freq_pengendalian', headerName: 'freq pengendalian' },
  { field: 'freq_nabati', headerName: 'freq nabati' },
  {
    headerName: 'aksi',
    valueGetter: (row) => (
      <a href={`/app/laporan/sb/${row.id}`}>
        <i class="fa-solid fa-circle-info"></i>
      </a>
    ),
  },
];

export const LaporanSbPage = ({
  laporanSbList,
  komoditasOption,
  provinsiOption,
}: {
  laporanSbList: LaporanSb[];
  komoditasOption: SelectTanaman[];
  provinsiOption: Provinsi[];
}) => {
  return (
    <div class="flex flex-col gap-5 p-5 shadow-inner">
      <div class="flex items-center gap-3 text-2xl">
        <i class="fa-solid fa-table"></i>
        <h1>Laporan Setengah Bulan</h1>
      </div>
      <div
        hx-get="/app/laporan/sb/filter"
        hx-target="#body-laporan-sb"
        hx-swap="innerHTML"
        hx-trigger="click from:#submit-filter"
        hx-include="*"
        class="grid grid-cols-4 gap-3 rounded-md border-t-2 border-t-secondary bg-white p-5"
      >
        <select
          name="tanaman_id"
          class="rounded border border-gray-200 px-4 py-2"
        >
          <option value="">PILIH Komoditas</option>
          {komoditasOption.map((value) => {
            return <option value={value.id}>{value.nama_tanaman}</option>;
          })}
        </select>
        <select
          name="provinsi_id"
          class="rounded border border-gray-200 px-4 py-2"
        >
          <option value="">PILIH Provinsi</option>
          {provinsiOption.map((value) => {
            return <option value={value.id}>{value.nama_provinsi}</option>;
          })}
        </select>
        <input
          type="text"
          placeholder="Dari tanggal"
          name="start_date"
          onfocus="this.type='date'"
          onblur="this.type='text'"
          class="rounded border border-gray-200 px-4 py-2"
        />
        <input
          type="text"
          placeholder="Sampai tanggal"
          name="end_date"
          onfocus="this.type='date'"
          onblur="this.type='text'"
          class="rounded border border-gray-200 px-4 py-2"
        />
        <button
          id="submit-filter"
          type="button"
          class="rounded bg-primary px-4 py-2 text-white"
        >
          Filter
        </button>
      </div>
      <Table
        id="laporan-sb-table"
        className="hover row-border max-w-full rounded-md bg-white shadow-xl"
        columns={columnLaporanSb}
        rowsData={laporanSbList}
      />
      {html`
        <script>
          $(document).ready(function () {
            $('#laporan-sb-table').DataTable({
              scrollX: true,
            });
          });
        </script>
      `}
    </div>
  );
};

const luasKerusakanColumn: ColumnHeader<LuasKerusakanSb>[] = [
  { field: 'kategori_kerusakan', headerName: 'kategori kerusakan' },
  { field: 'kategori_serangan', headerName: 'kategori serangan' },
  { field: 'luas_kerusakan', headerName: 'luas kerusakan' },
];

export const LaporanSbDetailPage = ({
  laporanSb,
}: {
  laporanSb: LaporanSb & {
    laporan_harian: LaporanHarian[];
    luas_kerusakan: LuasKerusakanSb[];
  };
}) => {
  return (
    <div class="flex flex-col gap-5 p-5 shadow-inner">
      <h1 class="text-xl">Laporan Harian</h1>
      <Table
        id="laporan-harian-table"
        columns={columnHeaders}
        rowsData={laporanSb.laporan_harian}
        className="max-w-full rounded-md bg-white shadow-lg"
      />
      <h1 class="text-xl">Luas Kerusakan</h1>
      <Table
        id="luas-kerusakan-table"
        columns={luasKerusakanColumn}
        rowsData={laporanSb.luas_kerusakan}
        className="max-w-full rounded-md bg-white shadow-lg"
      />
      {html`
        <script>
          $(document).ready(function () {
            $('#laporan-harian-table').DataTable({
              scrollX: true,
            });
            $('#luas-kerusakan-table').DataTable({
              scrollX: true,
            });
          });
        </script>
      `}
    </div>
  );
};
