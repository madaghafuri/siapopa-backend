import { LaporanHarian } from '../../../db/schema/laporan-harian';
import { Pengamatan } from '../../../db/schema/pengamatan';
import { Lokasi } from '../../../db/schema/lokasi';
import { Provinsi } from '../../../db/schema/provinsi';
import { KabupatenKota } from '../../../db/schema/kabupaten-kota';
import { Kecamatan } from '../../../db/schema/kecamatan';
import { Desa } from '../../../db/schema/desa';
import { ColumnHeader, Table } from '../../components/table';
import { SelectTanaman } from '../../../db/schema/tanaman';
import { html } from 'hono/html';
import { SelectUser } from '../../../db/schema/user';
import { SelectOPT } from '../../../db/schema/opt';

export const columnHeaders: ColumnHeader<
  LaporanHarian & {
    pengamatan: Pengamatan;
    lokasi: Lokasi & {
      provinsi: Omit<Provinsi, 'area_provinsi' | 'point_provinsi'>;
      kabupaten_kota: Omit<KabupatenKota, 'area_kabkot' | 'point_kabkot'>;
      kecamatan: Omit<Kecamatan, 'area_kecamatan' | 'point_kecamatan'>;
      desa: Omit<Desa, 'area_desa' | 'point_desa'>;
    };
    pic: SelectUser;
    opt: SelectOPT;
  }
>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  {
    field: 'sign_pic',
    headerName: 'signature',
    valueGetter: (row) => (
      <a href={row.sign_pic} target="_blank">
        <img class="h-10 w-10" src={row.sign_pic} alt="" />
      </a>
    ),
  },
  { headerName: 'Nama PIC', valueGetter: (row) => row.pic.name },
  {
    headerName: 'Kabupaten/Kota',
    valueGetter: (row) => row.lokasi.kabupaten_kota.nama_kabkot,
  },
  {
    headerName: 'Kecamatan',
    valueGetter: (row) => row.lokasi.kecamatan.nama_kecamatan,
  },
  { headerName: 'Desa', valueGetter: (row) => row.lokasi.desa.nama_desa },
  { headerName: 'blok', valueGetter: (row) => row.pengamatan.blok },
  { headerName: 'OPT', valueGetter: (row) => row.opt.nama_opt },
  {
    field: 'status_laporan_sb',
    headerName: 'status laporan setengah bulan',
    valueGetter: (row) => {
      if (!row.status_laporan_sb)
        return <i class="fa-solid fa-circle-xmark text-lg text-red-500"></i>;

      return <i class="fa-solid fa-circle-check text-lg text-green-500"></i>;
    },
  },
  { field: 'luas_waspada', headerName: 'luas waspada' },

  { field: 'rekomendasi_pengendalian', headerName: 'rekomendasi pengendalian' },
  { field: 'skala', headerName: 'skala' },
  {
    headerName: 'tgl pengamatan',
    valueGetter: (row) => row.pengamatan.tanggal_pengamatan,
  },
  { field: 'tanggal_laporan_harian', headerName: 'tgl laporan' },
  {
    headerName: 'Detail',
    valueGetter: (row) => (
      <a href={`/app/laporan/pengamatan/${row.pengamatan_id}`}>
        <i class="fa-solid fa-circle-info"></i>
      </a>
    ),
  },
];

export type DataLaporanHarian = LaporanHarian & {
  pengamatan: Pengamatan;
  lokasi: Lokasi & {
    provinsi: Omit<Provinsi, 'area_provinsi' | 'point_provinsi'>;
    kabupaten_kota: Omit<KabupatenKota, 'area_kabkot' | 'point_kabkot'>;
    kecamatan: Omit<Kecamatan, 'area_kecamatan' | 'point_kecamatan'>;
    desa: Omit<Desa, 'area_desa' | 'point_desa'>;
  };
  opt: SelectOPT;
  pic: SelectUser;
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
    <div class="isolate flex flex-col gap-5 p-5 shadow-inner">
      <div class="flex items-center gap-3 text-2xl">
        <i class="fa-solid fa-table"></i>
        <h1>Laporan Harian</h1>
        <button
          id="export-excel"
          class="rounded bg-primary px-4 py-2 text-sm text-white"
        >
          Export to Excel
        </button>
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

            $('#export-excel').click(function (e) {
              const wb = XLSX.utils.table_to_book(
                document.getElementById('laporan-harian-table')
              );
              XLSX.writeFile(wb, 'laporan_harian.xlsx');
            });
          });
        </script>
      `}
    </div>
  );
};
export default LaporanHarianPage;
