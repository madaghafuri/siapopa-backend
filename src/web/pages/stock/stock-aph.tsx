import { html } from 'hono/html';
import { Lokasi } from '../../../db/schema/lokasi';
import { SelectStockAph } from '../../../db/schema/stock-aph';
import { SelectUser } from '../../../db/schema/user';
import { ColumnHeader, Table } from '../../components/table';
import { SelectGolonganAph } from '../../../db/schema/golongan-aph';
import { SelectBentukAph } from '../../../db/schema/bentuk-stok-aph';
import {
  CustomTable,
  TableBody,
  TableHeader,
  TablePagination,
} from '../../components/custom-table';
import { KabupatenKota } from '../../../db/schema/kabupaten-kota';
import { Provinsi } from '../../../db/schema/provinsi';
import { Kecamatan } from '../../../db/schema/kecamatan';
import { Desa } from '../../../db/schema/desa';

export const stockAphColumn: ColumnHeader<
  SelectStockAph & {
    lokasi:
      | (Lokasi & {
          provinsi: Provinsi;
          kabupaten_kota: KabupatenKota;
          kecamatan: Kecamatan;
          desa: Desa;
        })
      | any;
    satpel: SelectUser;
    golongan_aph: SelectGolonganAph;
    bentuk_aph: SelectBentukAph;
  }
>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { headerName: 'Nama LPHP/LAH', valueGetter: (row) => row.satpel.name },
  {
    headerName: 'Provinsi',
    valueGetter: (row) => row.lokasi.provinsi.nama_provinsi,
  },
  {
    headerName: 'Kabupaten/Kota',
    valueGetter: (row) => row.lokasi.kabupaten_kota.nama_kabkot,
  },
  {
    headerName: 'Kecamatan',
    valueGetter: (row) => row.lokasi.kecamatan.nama_kecamatan,
  },
  { headerName: 'Desa', valueGetter: (row) => row.lokasi.desa.nama_desa },
  { headerName: 'Tahun', field: 'tahun_pelaksanaan' },
  { headerName: 'Bulan', field: 'bulan_pelaksanaan' },
  { headerName: 'Golongan', valueGetter: (row) => row.golongan_aph.jenis },
  {
    headerName: 'Jenis',
    valueGetter: (row) => <span class="italic">{row.jenis}</span>,
  },
  {
    headerName: 'Bentuk*)',
    valueGetter: (row) => `${row.bentuk_aph.bentuk} (${row.bentuk_aph.satuan})`,
  },
  { headerName: 'Sisa Stok Bulan Sebelumnya', field: 'sisa_volume' },
  { headerName: 'Vol. Produksi Bulan Ini', field: 'volume_produksi' },
  {
    headerName: 'Tanggal Produksi',
    valueGetter: (row) =>
      new Date(row.tanggal_produksi).toLocaleDateString('id-ID'),
  },
  { headerName: 'Volume Penggunaan Bulan Ini', field: 'volume_distribusi' },
  {
    headerName: 'Tanggal Penggunaan',
    valueGetter: (row) =>
      new Date(row.tanggal_distribusi).toLocaleDateString('id-ID'),
  },
  { headerName: 'Keterangan Kegiatan', field: 'keterangan_kegiatan' },
  { headerName: 'Tanggal Expired', field: 'tanggal_expired' },
];

export const StockAphPage = ({
  stockAphList,
  kabkotOptions,
}: {
  stockAphList: (SelectStockAph & { lokasi: Lokasi })[];
  kabkotOptions: Omit<KabupatenKota, 'area_kabkot' | 'point_kabkot'>[];
}) => {
  return (
    <div class="flex flex-col gap-3 p-5 shadow-inner">
      <div
        class="grid grid-cols-5 gap-5 rounded-md bg-white p-5 shadow-lg"
        hx-get="/app/stock/aph"
        hx-include="[name='kabkot_id']"
        hx-trigger="click from:#filter-btn"
        hx-target="#table-body"
      >
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold text-blue-700">
            Kabupaten/Kota
          </label>
          <select
            id="kabkot-options"
            name="kabkot_id"
            class="rounded-md border-gray-300 px-4 py-2"
          >
            <option value="">Pilih Kabupaten/Kota</option>
            {kabkotOptions.map((val) => (
              <option value={val.id}>{val.nama_kabkot}</option>
            ))}
          </select>
        </div>
        <button
          id="filter-btn"
          class="rounded-md bg-primary px-4 py-2 text-white"
        >
          Filter
        </button>
      </div>
      <div>
        <button
          class="rounded-md bg-primary px-4 py-2 text-white"
          hx-get="/app/stock/aph/create"
          hx-target="body"
          hx-swap="beforeend"
        >
          Tambah Stock APH
        </button>
      </div>
      <CustomTable
        pagination={
          <TablePagination requestUrl="/app/stock/aph" target="#table-body" />
        }
      >
        <TableHeader column={stockAphColumn} />
        <TableBody
          id="table-body"
          column={stockAphColumn}
          rowData={stockAphList}
          //@ts-ignore
          class="bg-white"
          hx-get="/app/stock/aph"
          hx-trigger="newAph from:body"
          hx-swap="innerHTML"
          hx-target="this"
        />
      </CustomTable>
      {html`
        <script>
          $(document).ready(function () {
            $('#table-stock-aph').DataTable({
              scrollX: true,
            });
            $('#kabkot-options').select2();
          });
        </script>
      `}
    </div>
  );
};
