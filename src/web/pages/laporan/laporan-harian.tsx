import { LaporanHarian } from '../../../db/schema/laporan-harian.js';
import { Pengamatan } from '../../../db/schema/pengamatan.js';
import { Lokasi } from '../../../db/schema/lokasi.js';
import { Provinsi } from '../../../db/schema/provinsi.js';
import { KabupatenKota } from '../../../db/schema/kabupaten-kota.js';
import { Kecamatan } from '../../../db/schema/kecamatan.js';
import { Desa } from '../../../db/schema/desa.js';
import { ColumnHeader, Table } from '../../components/table.js';
import { SelectTanaman } from '../../../db/schema/tanaman.js';
import { html } from 'hono/html';
import { UserData } from '../master/user.js';

export const columnHeaders: ColumnHeader<
  LaporanHarian & { pengamatan: Pengamatan; lokasi: Lokasi; pic: UserData }
>[] = [
  {
    field: 'sign_pic',
    headerName: 'signature',
    valueGetter: (row) => (
      <a href={row.sign_pic}>
        <img class="h-10 w-10" src={row.sign_pic} alt="" />
      </a>
    ),
  },
  {
    field: 'status_laporan_sb',
    headerName: 'status laporan setengah bulan',
    valueGetter: (row) => {
      if (!row.status_laporan_sb)
        return <i class="fa-solid fa-circle-xmark text-lg text-red-500"></i>;

      return <i class="fa-solid fa-circle-check text-lg text-green-500"></i>;
    },
  },
  { field: 'rekomendasi_pengendalian', headerName: 'rekomendasi pengendalian' },
  { field: 'skala', headerName: 'skala' },
  { field: 'luas_waspada', headerName: 'luas waspada' },
  { field: 'tanggal_laporan_harian', headerName: 'tgl laporan' },
];

export type DataLaporanHarian = LaporanHarian & {
  pengamatan: Pengamatan;
  lokasi: Lokasi & {
    provinsi: Provinsi;
    kabupaten_kota: KabupatenKota;
    kecamatan: Kecamatan;
    desa: Desa;
  };
};

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
      <div class="flex items-center gap-3 text-2xl">
        <i class="fa-solid fa-table"></i>
        <h1>Laporan Harian</h1>
      </div>
      <div
        hx-get="/app/laporan/harian/filter"
        hx-trigger="click from:#filter-submit"
        hx-include="*"
        hx-swap="innerHTML"
        hx-target="#table-body"
        class="grid max-w-full grid-cols-4 gap-5 rounded border border-t-2 border-gray-200 border-t-secondary bg-white p-3 shadow-xl"
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
          id="filter-submit"
          type="button"
          class="rounded bg-primary px-4 py-2 text-white"
        >
          Filter
        </button>
      </div>
      <canvas id="laporan-harian-chart" class="bg-white"></canvas>
      <Table
        id="laporan-harian-table"
        columns={columnHeaders}
        rowsData={listLaporan}
        className="display nowrap max-w-full rounded-md border-t-secondary bg-white"
      />
      {html`
        <script>
          $(document).ready(function () {
            $('#laporan-harian-table').DataTable({
              scrollX: true,
            });
          });
          const ctx = document.getElementById('laporan-harian-chart');
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: Utils.months({ count: 12 }),
              datasets: [
                {
                  label: '# of Votes',
                  data: [12, 19, 3, 5, 2, 3],
                  borderWidth: 1,
                },
              ],
            },
            options: {
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            },
          });
        </script>
      `}
    </div>
  );
};
export default LaporanHarianPage;
