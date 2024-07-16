import { html } from 'hono/html';
import { LaporanBulanan } from '../../../db/schema/laporan-bulanan';
import { ColumnHeader, Table } from '../../components/table.js';

export const laporanBulananColumn: ColumnHeader<LaporanBulanan>[] = [
  { field: 'note', headerName: 'note' },
  {
    field: 'status_laporan_musiman',
    headerName: 'status laporan musiman',
    valueGetter: (row) => {
      if (!row.status_laporan_musiman)
        return <i class="fa-solid fa-circle-xmark"></i>;

      return <i class="fa-solid fa-circle-check"></i>;
    },
  },
  {
    field: 'sign_pic',
    headerName: 'signature',
    valueGetter: (row) => <img class="h-10 w-10" src={row.sign_pic} alt="" />,
  },
  { field: 'periode_laporan_bulanan', headerName: 'periode' },
  { field: 'start_date', headerName: 'tgl mulai' },
  { field: 'end_date', headerName: 'tgl akhir' },
];

export const LaporanBulananPage = ({
  laporanBulananData,
}: {
  laporanBulananData: LaporanBulanan[];
}) => {
  return (
    <div class="flex flex-col gap-3 p-5 shadow-inner">
      <div class="flex items-center gap-3 text-2xl">
        <i class="fa-solid fa-table"></i>
        <h1>Laporan Bulanan</h1>
      </div>
      {/* <div class="grid grid-cols-5 rounded bg-white p-5">
        <select class="rounded border px-2 py-1"></select>
      </div> */}
      <Table
        id="laporan-bulanan-table"
        columns={laporanBulananColumn}
        rowsData={laporanBulananData}
      />
      {html`
        <script>
          $(document).ready(function () {
            $('#laporan-bulanan-table').DataTable();
          });
        </script>
      `}
    </div>
  );
};
