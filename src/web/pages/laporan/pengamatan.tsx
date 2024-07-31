import { html } from 'hono/html';
import { Pengamatan } from '../../../db/schema/pengamatan';
import { ColumnHeader, Table } from '../../components/table';
import { Lokasi } from '../../../db/schema/lokasi';
import { SelectTanaman } from '../../../db/schema/tanaman';
import { SelectUser } from '../../../db/schema/user';
import { Kerusakan } from '../../../db/schema/detail-rumpun';
import { Provinsi } from '../../../db/schema/provinsi';
import { KabupatenKota } from '../../../db/schema/kabupaten-kota';
import { Kecamatan } from '../../../db/schema/kecamatan';
import { Desa } from '../../../db/schema/desa';
import { Fragment } from 'hono/jsx/jsx-runtime';
import { SelectRumpun } from '../../../db/schema/rumpun';
import { PhotoPengamatan } from '../../../db/schema/photo-pengamatan';
import { LaporanHarian } from '../../../db/schema/laporan-harian';

export const pengamatanColumn: ColumnHeader<
  Pengamatan & {
    tanaman: SelectTanaman;
    locations: Lokasi & {
      provinsi?: Provinsi;
    };
    pic?: SelectUser;
  }
>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  {
    headerName: 'provinsi',
    valueGetter: (row) => row.locations.provinsi.nama_provinsi,
  },
  { headerName: 'blok', field: 'blok' },
  { headerName: 'hari ke', field: 'hari_ke' },
  { headerName: 'ph tanah', field: 'ph_tanah' },
  { headerName: 'varietas', field: 'varietas' },
  { headerName: 'komoditas', valueGetter: (row) => row.tanaman.nama_tanaman },
  { headerName: 'dari umur', field: 'dari_umur' },
  { headerName: 'hingga umur', field: 'hingga_umur' },
  { headerName: 'pola tanam', field: 'pola_tanam' },
  { headerName: 'luas hamparan', field: 'luas_hamparan' },
  { headerName: 'luas diamati', field: 'luas_diamati' },
  { headerName: 'luas persemaian', field: 'luas_persemaian' },
  { headerName: 'luas hasil panen', field: 'luas_hasil_panen' },
  { headerName: 'tgl pengamatan', field: 'tanggal_pengamatan' },
  {
    headerName: 'aksi',
    valueGetter: (row) => (
      <a href={`/app/laporan/pengamatan/${row.id}`}>
        <i class="fa-solid fa-circle-info"></i>
      </a>
    ),
  },
];

export const rumpunColumn: ColumnHeader<SelectRumpun>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { field: 'rumpun_ke', headerName: 'rumpun ke' },
  { field: 'jumlah_anakan', headerName: 'jumlah anakan' },
  { field: 'luas_spot_hopperburn', headerName: 'luas spot hopperburn' },
];

export const PengamatanPage = ({
  pengamatanList,
  komoditasOption,
  provinsiOption,
}: {
  pengamatanList: Pengamatan[];
  komoditasOption: SelectTanaman[];
  provinsiOption: Provinsi[];
}) => {
  return (
    <div class="isolate flex flex-col gap-5 p-5 shadow-inner">
      <div class="flex items-center gap-3 text-2xl">
        <i class="fa-solid fa-table"></i>
        <h1>Pengamatan</h1>
      </div>
      <div
        hx-get="/app/laporan/pengamatan/filter"
        hx-trigger="click from:#filter-submit"
        hx-include="*"
        hx-swap="innerHTML"
        hx-target="#table-body"
        class="grid grid-cols-4 gap-5 rounded border-t-2 border-t-secondary bg-white p-5"
      >
        <select
          name="tanaman_id[]"
          class="rounded border border-gray-200 px-4 py-2"
        >
          <option value="">PILIH KOMODITAS</option>
          {komoditasOption.map((val) => {
            return <option value={val.id}>{val.nama_tanaman}</option>;
          })}
        </select>
        <select
          name="provinsi_id[]"
          class="rounded border border-gray-200 px-4 py-2"
        >
          <option value="">PILIH PROVINSI</option>
          {provinsiOption.map((value) => {
            return <option value={value.id}>{value.nama_provinsi}</option>;
          })}
        </select>
        <button
          class="rounded bg-primary px-4 py-2 text-white"
          hx-indicator="#loading"
          type="button"
          id="filter-submit"
        >
          <div id="loading">
            <p>Filter</p>
            <i class="fa-solid fa-spinner"></i>
          </div>
        </button>
      </div>
      <Table
        id="pengamatan-table"
        columns={pengamatanColumn}
        rowsData={pengamatanList}
        className="hover display nowrap max-w-full rounded-md bg-white"
      />
      {html`
        <script>
          $(document).ready(function () {
            $('#pengamatan-table').DataTable({
              scrollX: true,
            });
          });
        </script>
      `}
    </div>
  );
};

export const PengamatanDetailPage = ({
  pengamatan,
  rumpunData,
}: {
  pengamatan: {
    pengamatan: Pengamatan;
    laporan_harian: LaporanHarian;
    lokasi: Lokasi & {
      provinsi: Provinsi;
      kabupaten_kota: KabupatenKota;
      kecamatan: Kecamatan;
      desa: Desa;
    };
    tanaman: SelectTanaman;
    pic: SelectUser;
    hasil_pengamatan: {
      opt_id: number;
      kode_opt: string;
      skala: Kerusakan;
      hasil_perhitungan: string;
    }[];
    bukti_pengamatan?: PhotoPengamatan[];
  };
  rumpunData: SelectRumpun[];
}) => {
  type HasilRumpun = (typeof pengamatan.hasil_pengamatan)[number];

  const columnHasilRumpun: ColumnHeader<HasilRumpun>[] = [
    { headerName: 'OPT/MA', field: 'kode_opt' },
    { headerName: 'Hasil Perhitungan', field: 'hasil_perhitungan' },
    { headerName: 'Satuan', field: 'skala' },
  ];

  return (
    <div class="flex flex-col gap-5 bg-background p-5 shadow-inner">
      <h1 class="text-2xl font-medium">
        <i class="fa-solid fa-table mr-3"></i>
        Pengamatan Detail
      </h1>
      <section class="flex flex-col gap-1 rounded-md bg-white shadow-lg">
        <h1 class="bg-soft py-5 text-center text-xl font-bold">
          Data Laporan Harian
        </h1>
        <h2 class="py-1 text-center text-lg font-medium">
          {new Date(
            pengamatan.laporan_harian.tanggal_laporan_harian
          ).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </h2>
        <div class="grid grid-cols-2 gap-2 p-3">
          <div class="grid grid-cols-2">
            <p>Luas Waspada</p>
            <p>: {pengamatan.laporan_harian.luas_waspada}</p>
          </div>
          <div class="grid grid-cols-2">
            <p>Rekomendasi Pengendalian</p>
            <p>: {pengamatan.laporan_harian.rekomendasi_pengendalian}</p>
          </div>
          <div class="grid grid-cols-2">
            <p>Status</p>
            <p>
              :{' '}
              {pengamatan.laporan_harian.status_laporan_sb
                ? 'Valid'
                : 'Belum Valid'}
            </p>
          </div>
        </div>
      </section>
      <section class="flex flex-col gap-1 rounded-md bg-white shadow-lg">
        <h1 class="bg-soft py-5 text-center text-xl font-bold">
          Data Pengamatan
        </h1>
        <h2 class="py-1 text-center text-lg font-medium">
          {new Date(
            pengamatan.pengamatan.tanggal_pengamatan
          ).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </h2>
        <div class="grid grid-cols-2 gap-2 p-3">
          {Object.entries(pengamatan.pengamatan).map(([key, value]) => {
            return (
              <div class="grid grid-cols-2">
                <p class="capitalize">
                  {key.includes('_') ? key.split('_').join(' ') : key}
                </p>
                <p>: {value}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section class="flex flex-col gap-1 rounded-md bg-white shadow-lg">
        <h1 class="bg-soft py-5 text-center text-xl font-bold">
          Luas Pengamatan (Ha)
        </h1>
        <div class="grid grid-cols-2 gap-2 p-3">
          <div class="grid grid-cols-2">
            <p>Hamparan (Ha)</p>
            <p>: {pengamatan.pengamatan.luas_hamparan}</p>
          </div>
          <div class="grid grid-cols-2">
            <p>Diamati (Ha)</p>
            <p>: {pengamatan.pengamatan.luas_diamati}</p>
          </div>
          <div class="grid grid-cols-2">
            <p>Panen (Ha)</p>
            <p>: {pengamatan.pengamatan.luas_hasil_panen}</p>
          </div>
          <div class="grid grid-cols-2">
            <p>Persemaian (Ha)</p>
            <p>: {pengamatan.pengamatan.luas_persemaian}</p>
          </div>
        </div>
      </section>
      <Table
        id="hasil-pengamatan"
        className="display hover nowrap max-w-full rounded-md bg-white shadow-lg"
        columns={columnHasilRumpun}
        rowsData={pengamatan.hasil_pengamatan}
      />
      <div class="flex flex-col items-end">
        <div class="flex flex-col gap-2 rounded-md bg-white p-3 shadow-lg">
          <p>
            {pengamatan.lokasi.kabupaten_kota.nama_kabkot},{' '}
            {new Date(
              pengamatan.pengamatan.tanggal_pengamatan
            ).toLocaleDateString('id-ID')}
          </p>
          <img class="aspect-[4/3] w-40" src={pengamatan.pengamatan.sign_pic} />
          <p>{pengamatan.pic.name}</p>
        </div>
      </div>
      {html`
        <script>
          $(document).ready(function () {
            $('#hasil-pengamatan').DataTable({
              scrollX: true,
              layout: {
                topStart: null,
                topEnd: null,
              },
            });
          });
        </script>
      `}
    </div>
  );
};
