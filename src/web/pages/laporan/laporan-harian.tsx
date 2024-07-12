import { LaporanHarian } from '../../../db/schema/laporan-harian.js';
import { Pengamatan } from '../../../db/schema/pengamatan.js';
import { Lokasi } from '../../../db/schema/lokasi.js';
import { Provinsi } from '../../../db/schema/provinsi.js';
import { KabupatenKota } from '../../../db/schema/kabupaten-kota.js';
import { Kecamatan } from '../../../db/schema/kecamatan.js';
import { Desa } from '../../../db/schema/desa.js';
import { ColumnHeader } from '../../components/table.js';
import { SelectTanaman } from '../../../db/schema/tanaman.js';
import { html } from 'hono/html';
import { UserData } from '../master/user.js';

export const columnHeaders: ColumnHeader<LaporanHarian & { pengamatan: Pengamatan; lokasi: Lokasi; pic: UserData }>[] = [
  { headerName: 'signature', field: 'sign_pic' },
  { headerName: 'tgl lapor', field: 'tanggal_laporan_harian' },
  { headerName: 'POPT', field: 'pic' },
  { headerName: 'wilayah', field: 'lokasi' },
  { headerName: 'umur tanam', span: '1' },
  { headerName: 'luas tanam', span: '2' },
];

export type DataLaporanHarian = LaporanHarian & {
  pengamatan: Pengamatan; lokasi: Lokasi & {
    provinsi: Provinsi;
    kabupaten_kota: KabupatenKota;
    kecamatan: Kecamatan;
    desa: Desa
  }
}

const LaporanHarianPage = ({
  listLaporan,
  komoditasOption,
  provinsiOption,
}: {
  listLaporan: DataLaporanHarian[];
  komoditasOption: SelectTanaman[];
  provinsiOption: Provinsi[];
}) => {
  return (
    <div class="isolate flex flex-col gap-5 bg-background p-5 shadow-inner">
      <h1 class="text-lg font-bold">Laporan Harian</h1>
      <div
        hx-get="/app/laporan/harian/filter"
        hx-trigger="click from:#filter-submit"
        hx-include="*"
        hx-swap="innerHTML"
        hx-target="#table-body"
        class="grid w-full grid-cols-4 gap-5 rounded border border-t-2 border-gray-200 border-t-secondary bg-white p-3 shadow-xl"
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
          placeholder='Dari tanggal'
          name="start_date"
          onfocus="this.type='date'"
          onblur="this.type='text'"
          class="rounded border border-gray-200 px-4 py-2"
        />
        <input
          type="date"
          placeholder='Sampai tanggal'
          name="end_date"
          class="rounded border border-gray-200 px-4 py-2"
        />
        <button
          id="filter-submit"
          type="button"
          class="rounded bg-primary px-4 py-2 text-white"
        >
          Filter
        </button>
      </div>
      <table id="laporanTable" class="border-t-2 border-t-secondary bg-white rounded" style="width: 100%">
        <thead >
          <tr >
            {columnHeaders.map((column) => {
              return <th class={`border-b border-gray-200 px-4 py-2 capitalize text-sm font-medium text-blue-500`}>{column.headerName}</th>
            })}
          </tr>
        </thead>
        <tbody id="table-body">
          {listLaporan.map((laporan) => {
            return <tr key={laporan.id}>
              {columnHeaders.map((column) => {
                return <td class={`border-b border-gray-200 px-4 py-2`}>{laporan[column.field]}</td>
              })}
            </tr>
          })}
        </tbody>
      </table>
      {html`
        <script>
          $(document).ready(function() {
            $('#laporanTable').DataTable()
          });
        </script>
      `}
    </div>
  );
};
export default LaporanHarianPage;
