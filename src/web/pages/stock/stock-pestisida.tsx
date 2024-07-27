import { html } from 'hono/html';
import { AuthenticatedUser } from '../../components/profile.js';
import { ColumnHeader, Table } from '../../components/table.js';
import { SelectPestisida } from '../../../db/schema/pestisida.js';

export type StockPestisida = {
  id: number;
  satuan: string;
  nama_opt: string;
  nama_tanaman: string;
  volume: number;
  merk_dagang: string,
  periode_bulan: string,
  tahun_pengadaan: string,
  bahanAktif: string,
  expired_date: string,
  provinsi: string;
  kabupatenKota: string;
  kecamatan: string;
  desa: string;
  nama_golongan: string;
};

export const stockPestisidaColumn: ColumnHeader<StockPestisida>[] = [
  { headerName: "no", valueGetter: (_, index) => index + 1},
  { headerName: 'satuan', field: 'satuan'},
  { headerName: 'golongan', field: 'nama_golongan'},
  { headerName: 'nama opt', field: 'nama_opt'},
  { headerName: 'tanaman', field: 'nama_tanaman'},
  { headerName: 'provinsi', field: 'provinsi'},
  { headerName: 'kabupaten/kota', field: 'kabupatenKota'},
  { headerName: 'kecamatan', field: 'kecamatan'},
  { headerName: 'desa', field: 'desa'},
]

const DataStockPestisida = ({
  listStockPestisida,
  user,
}: {
  listStockPestisida: StockPestisida[];
  user?: AuthenticatedUser;
}) => {
  return (
    <div class="isolate flex flex-col gap-5 p-5 shadow-inner">
      {!!user ? (
        <div>
          <button
            class="rounded bg-primary px-2 py-1 text-white"
            hx-get="/app/stock/stock-pestisida/create"
            hx-target="body"
            hx-swap="beforeend"
          >
            Add Pestisida
          </button>
        </div>
      ) : null}
      <table id="stockPestisidaTable" class="hover display nowrap max-w-full rounded-md bg-white" style="width:100%">
        <thead>
          <tr>
            <th class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              No.
            </th>
            <th class="border-b border-gray-200 px-4 py-2">Golongan</th>
            <th class="border-b border-gray-200 px-4 py-2">Merk Dagang</th>
            <th class="border-b border-gray-200 px-4 py-2">Bahan Aktif</th>
            <th class="border-b border-gray-200 px-4 py-2">Komoditas</th>
            <th class="border-b border-gray-200 px-4 py-2">OPT Sasaran</th>
            <th class="border-b border-gray-200 px-4 py-2">Volume</th>
            <th class="border-b border-gray-200 px-4 py-2">Satuan</th>
            <th class="border-b border-gray-200 px-4 py-2">Expired Date</th>
            <th class="border-b border-gray-200 px-4 py-2">Periode Bulan</th>
            <th class="border-b border-gray-200 px-4 py-2">Tahun Pengadaan</th>
            <th class="border-b border-gray-200 px-4 py-2">Provinsi</th>
            <th class="border-b border-gray-200 px-4 py-2">Kabupaten/Kota</th>
            <th class="border-b border-gray-200 px-4 py-2">Kecamatan</th>
            <th class="border-b border-gray-200 px-4 py-2">Desa</th>
            <th class="border-b border-gray-200 px-4 py-2"></th>
            <th class="border-b border-gray-200 px-4 py-2" style="width: 10%">Actions</th>
          </tr>
        </thead>
        <tbody
          hx-get="/app/stock/stock-pestisida/reload"
          hx-trigger="newPestisida from:body"
        >
          {listStockPestisida.map((pestisida, index) => (
            <tr key={pestisida.id}>
              <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
                {index + 1}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {pestisida.nama_golongan}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {pestisida.merk_dagang}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {pestisida.bahanAktif}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {pestisida.nama_tanaman}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {pestisida.nama_opt}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {pestisida.volume}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {pestisida.satuan}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {pestisida.expired_date}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {pestisida.periode_bulan}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {pestisida.tahun_pengadaan}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {pestisida.provinsi}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {pestisida.kabupatenKota}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {pestisida.kecamatan}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {pestisida.desa}
              </td>
              <td class="border-b border-gray-200 px-4 py-2" style="width: 10%">
              <div class="flex items-center space-x-2">
                  <button
                    class="text-blue-500 hover:text-blue-700 px-4"
                    hx-get={`/app/stock/stock-pestisida/edit/${pestisida.id}`}
                    hx-target="body"
                    hx-swap="beforeend"
                    >
                      <i class="fa fa-edit"></i>
                    </button>
                    <button
                      class="ml-2 text-red-500 hover:text-red-700 px-4"
                      hx-delete={`/app/stock/stock-pestisida/delete/${pestisida.id}`}
                      hx-target="#stockPestisidaTable"
                      hx-swap="outerHTML"
                      hx-confirm="Are you sure you want to delete this item?"
                      >
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {html`
        <script>
          $(document).ready(function () {
            $('#stockPestisidaTable').DataTable({scrollX: true});
          });
        </script>
      `}
    </div>
  );
};

export default DataStockPestisida;
