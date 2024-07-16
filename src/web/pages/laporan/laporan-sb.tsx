import { html } from 'hono/html';
import { LaporanSb } from '../../../db/schema/laporan-sb.js';
import { ColumnHeader } from '../../components/table.js';
import { SelectTanaman } from '../../../db/schema/tanaman.js';
import { Provinsi } from '../../../db/schema/provinsi.js';

export const columnLaporanSb: ColumnHeader<LaporanSb>[] = [
  { field: 'status_laporan_bulanan', headerName: 'status' },
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
      <table
        id="laporan-sb-table"
        class="hover border-t-2 border-t-secondary bg-white"
        style="width:100%"
      >
        <thead>
          <tr>
            {columnLaporanSb.map((value) => {
              return (
                <th class="border-b border-gray-200 px-4 py-2 text-sm font-medium capitalize text-blue-500">
                  {value.headerName}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody id="body-laporan-sb">
          {laporanSbList.map((row) => {
            return (
              <tr key={row.id}>
                {columnLaporanSb.map((column) => {
                  return (
                    <td class="border-b border-gray-200 text-center">
                      {column?.valueGetter?.(row) || row[column.field]}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {html`
        <script>
          $(document).ready(function () {
            $('#laporan-sb-table').DataTable();
          });
        </script>
      `}
    </div>
  );
};

export const LaporanSbDetailPage = ({
  laporanSb,
}: {
  laporanSb: LaporanSb;
}) => {
  return (
    <div class="flex flex-col gap-5 p-5 shadow-inner">
      <div>Data</div>
      <table
        id="laporan-harian-table"
        class="border-t-2 border-t-secondary bg-white"
        style="width:100%"
      >
        <thead></thead>
        <tbody></tbody>
      </table>
      {html`
        <script>
          $(document).ready(function () {
            $('#laporan-harian-table').DataTable();
          });
        </script>
      `}
    </div>
  );
};
