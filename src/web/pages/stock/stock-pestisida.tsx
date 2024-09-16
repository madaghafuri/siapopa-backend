import { html } from 'hono/html';
import { AuthenticatedUser } from '../../components/profile.js';
import { ColumnHeader, Table } from '../../components/table.js';
import {
  CustomTable,
  TableBody,
  TableHeader,
} from '../../components/custom-table.js';

export type StockPestisida = {
  id: number;
  satuan: string;
  nama_opt: string;
  nama_tanaman: string;
  volume: number;
  merk_dagang: string;
  periode_bulan: string;
  tahun_pengadaan: string;
  bahanAktif: string;
  expired_date: string;
  provinsi: string;
  kabupatenKota: string;
  kecamatan: string;
  desa: string;
  nama_golongan: string;
  alamat: string;
};

export const stockPestisidaColumn: ColumnHeader<StockPestisida>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { headerName: 'satuan', field: 'satuan' },
  { headerName: 'golongan', field: 'nama_golongan' },
  { headerName: 'nama opt', field: 'nama_opt' },
  { headerName: 'tanaman', field: 'nama_tanaman' },
  { headerName: 'provinsi', field: 'provinsi' },
  { headerName: 'kabupaten/kota', field: 'kabupatenKota' },
  { headerName: 'kecamatan', field: 'kecamatan' },
  { headerName: 'desa', field: 'desa' },
  { headerName: 'alamat', field: 'alamat' },
  { headerName: 'volume', field: 'volume' },
  {
    headerName: 'expired date',
    valueGetter: (row) =>
      new Date(row.expired_date).toLocaleDateString('id-ID', {
        year: 'numeric',
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
  },
  {
    headerName: 'periode bulan',
    valueGetter: (row) => row.periode_bulan.split('-')[1],
  },
  {
    headerName: 'tahun pengadaan',
    valueGetter: (row) => row.tahun_pengadaan.split('-')[0],
  },
];

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
          {user && (
            <button
              class="rounded bg-primary px-2 py-1 text-white"
              hx-get="/app/stock/stock-pestisida/create"
              hx-target="body"
              hx-swap="beforeend"
            >
              Add Pestisida
            </button>
          )}
        </div>
      ) : null}
      <CustomTable>
        <TableHeader column={stockPestisidaColumn} />
        <TableBody
          id="table-body"
          column={stockPestisidaColumn}
          rowData={listStockPestisida}
          //@ts-ignore
          class="bg-white"
          hx-get="/app/stock/stock-pestisida"
          hx-trigger="newPestisida from:body"
          hx-target="this"
          hx-swap="innerHTML"
        />
      </CustomTable>
    </div>
  );
};

export default DataStockPestisida;
