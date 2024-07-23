import { html } from 'hono/html';
import { AuthenticatedUser } from '../../components/profile.js';
import { ColumnHeader, Table } from '../../components/table.js';

export type StockPestisida = {
  satuan: string;
  nama_opt: string;
  nama_tanaman: string;
  volume: number;
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
    <div class="grid p-5 shadow-inner">
      <Table id='stockPestisidaTable' className="rounded-md bg-white hover" columns={stockPestisidaColumn} rowsData={listStockPestisida} />
      {html`
        <script>
          $(document).ready(function () {
            $('#stockPestisidaTable').DataTable();
          });
        </script>
      `}
    </div>
  );
};

export default DataStockPestisida;
