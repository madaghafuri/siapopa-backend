import { html } from 'hono/html';
import { Pengamatan } from '../../../db/schema/pengamatan.js';
import { ColumnHeader, Table } from '../../components/table.js';
import { Lokasi } from '../../../db/schema/lokasi.js';
import { SelectTanaman } from '../../../db/schema/tanaman.js';
import { SelectUser } from '../../../db/schema/user.js';
import { Kerusakan } from '../../../db/schema/detail-rumpun.js';
import { Provinsi } from '../../../db/schema/provinsi.js';
import { KabupatenKota } from '../../../db/schema/kabupaten-kota.js';
import { Kecamatan } from '../../../db/schema/kecamatan.js';
import { Desa } from '../../../db/schema/desa.js';
import { Fragment } from 'hono/jsx/jsx-runtime';
import { SelectRumpun } from '../../../db/schema/rumpun.js';

export const pengamatanColumn: ColumnHeader<Pengamatan>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { headerName: 'blok', field: 'blok' },
  { headerName: 'hari ke', field: 'hari_ke' },
  { headerName: 'ph tanah', field: 'ph_tanah' },
  { headerName: 'varietas', field: 'varietas' },
  { headerName: 'komoditas', field: 'komoditas' },
  { headerName: 'dari umur', field: 'dari_umur' },
  { headerName: 'hingga umur', field: 'hingga_umur' },
  { headerName: 'pola tanam', field: 'pola_tanam' },
  { headerName: 'luas hamparan', field: 'luas_hamparan' },
  { headerName: 'luas diamati', field: 'luas_diamati' },
  { headerName: 'luas persemaian', field: 'luas_persemaian' },
  { headerName: 'luas hasil panen', field: 'luas_hasil_panen' },
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
}: {
  pengamatanList: Pengamatan[];
}) => {
  return (
    <div class="flex flex-col gap-5 p-5 shadow-inner">
      <div class="flex items-center gap-3 text-2xl">
        <i class="fa-solid fa-table"></i>
        <h1>Pengamatan</h1>
      </div>
      {/* <div class="grid grid-cols-4 gap-5 bg-white rounded border-t-secondary border-t-2 p-5">
      <select class="px-4 py-2 border border-gray-200 rounded"></select>
      <select class="px-4 py-2 border-gray-200 rounded"></select>
    </div> */}
      <Table
        id="pengamatan-table"
        columns={pengamatanColumn}
        rowsData={pengamatanList}
        className="hover row-border border-t-2 border-t-secondary bg-white"
      />
      {html`
        <script>
          $(document).ready(function () {
            $('#pengamatan-table').DataTable();
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
  };
  rumpunData: SelectRumpun[];
}) => {
  return (
    <div class="flex flex-col gap-5 bg-background p-5 shadow-inner">
      <h1 class="text-2xl font-medium">
        <i class="fa-solid fa-table mr-3"></i>
        Pengamatan Detail
      </h1>
      <div class="grid grid-cols-4 rounded border border-gray-200 bg-white text-sm shadow-lg">
        <div class="grid grid-cols-[60%,auto]">
          <h4 class="px-4 py-2">Tgl Pengamatan:</h4>
          <h4 class="px-4 py-2">{pengamatan.pengamatan.tanggal_pengamatan}</h4>
        </div>
        <div class="grid grid-cols-[60%,auto]">
          <h4 class="px-4 py-2">POPT:</h4>
          <h4 class="px-4 py-2">{pengamatan.pic.name}</h4>
        </div>
        <div class="grid grid-cols-[60%,auto]">
          <h4 class="px-4 py-2">Provinsi:</h4>
          <h4 class="px-4 py-2">{pengamatan.lokasi.provinsi.nama_provinsi}</h4>
        </div>
        <div class="grid grid-cols-[60%,auto]">
          <h4 class="px-4 py-2">Kota/Kab:</h4>
          <h4 class="px-4 py-2">
            {pengamatan.lokasi.kabupaten_kota.nama_kabkot}
          </h4>
        </div>
        <div class="grid grid-cols-[60%,auto]">
          <h4 class="px-4 py-2">Kecamatan:</h4>
          <h4 class="px-4 py-2">
            {pengamatan.lokasi.kecamatan.nama_kecamatan}
          </h4>
        </div>
        <div class="grid grid-cols-[60%,auto]">
          <h4 class="px-4 py-2">Desa:</h4>
          <h4 class="px-4 py-2">{pengamatan.lokasi.desa.nama_desa}</h4>
        </div>
        <div class="grid grid-cols-[60%,auto]">
          <h4 class="px-4 py-2">Komoditas:</h4>
          <h4 class="px-4 py-2">{pengamatan.pengamatan.komoditas}</h4>
        </div>
        <div class="grid grid-cols-[60%,auto]">
          <h4 class="px-4 py-2">Varietas:</h4>
          <h4 class="px-4 py-2">{pengamatan.pengamatan.varietas}</h4>
        </div>
        <div class="grid grid-cols-[60%,auto]">
          <h4 class="px-4 py-2">Lat:</h4>
          <h4 class="px-4 py-2">{pengamatan.pengamatan.point_pengamatan[1]}</h4>
        </div>
        <div class="grid grid-cols-[60%,auto]">
          <h4 class="px-4 py-2">Long:</h4>
          <h4 class="px-4 py-2">{pengamatan.pengamatan.point_pengamatan[0]}</h4>
        </div>
      </div>
      <table
        id="hasil-pengamatan"
        class="hover border-t-2 border-t-secondary bg-white"
        style="width:100%"
      >
        <thead>
          <tr>
            <th class="border-b border-gray-200 px-4 py-2 text-sm font-medium capitalize text-blue-500">
              no
            </th>
            {Object.entries(pengamatan.hasil_pengamatan[0]).map(([key]) => {
              return (
                <th class="border-b border-gray-200 px-4 py-2 text-sm font-medium capitalize text-blue-500">
                  {key}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {pengamatan.hasil_pengamatan.map((val, index) => {
            return (
              <tr key={index}>
                <td class="border-b border-gray-200 px-4 py-2">{index + 1}</td>
                {Object.entries(val).map(([_, value]) => {
                  return (
                    <td class="border-b border-gray-200 px-4 py-2">{value}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <h2 class="text-lg font-medium">Rumpun</h2>
      <Table id="rumpun-table" rowsData={rumpunData} columns={rumpunColumn} />
      <div class="grid grid-cols-2 gap-5">
        <div class="flex flex-col gap-3 rounded-md bg-white p-5 shadow-lg">
          <div class="text-center text-lg font-medium text-blue-700">
            Profil POPT
          </div>
          <div class="flex items-center justify-center">
            {!!pengamatan.pic.photo ? (
              <img
                class="h-24 w-24 rounded-full"
                src={pengamatan.pic.photo}
                alt="profile photo"
              />
            ) : (
              <img
                class="h-24 w-24 rounded-full border border-gray-300"
                src="/assets/avatar.jpg"
              />
            )}
          </div>
          <div class="grid grid-cols-[60%,auto]">
            {Object.entries(pengamatan.pic).map(([key, value]) => {
              if (
                key === 'password' ||
                key === 'photo' ||
                key === 'validasi' ||
                key === 'usergroup_id' ||
                key === 'user_group'
              )
                return;

              return (
                <Fragment>
                  <p class="border-b border-gray-200 px-4 py-2 capitalize">
                    {key}:
                  </p>
                  <p class="border-b border-gray-200 px-4 py-2">{value}</p>
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {html`
        <script>
          $(document).ready(function () {
            $('#hasil-pengamatan').DataTable();
            $('#rumpun-table').DataTable();
          });
        </script>
      `}
    </div>
  );
};
