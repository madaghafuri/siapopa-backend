import { html } from 'hono/html';
import { LaporanMusiman } from '../../../db/schema/laporan-musiman.js';
import { ColumnHeader, Table } from '../../components/table.js';

const laporanMusimanColumn: ColumnHeader<LaporanMusiman>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { field: 'note', headerName: 'note', span: '2' },
  { field: 'sign_pic', headerName: 'signature', span: '1' },
  { field: 'start_date', headerName: 'tgl mulai' },
  { field: 'end_date', headerName: 'tgl akhit' },
  { field: 'tanggal', headerName: 'tgl laporan' },
];

export const LaporanMusimanPage = ({
  dataLaporanMusiman,
}: {
  dataLaporanMusiman: LaporanMusiman[];
}) => {
  return (
    <div class="p-5">
      <div class="flex items-center gap-3 text-2xl">
        <i class="fa-solid fa-table"></i>
        <h1>Laporan Musiman</h1>
        <button
          id="export-excel"
          class="rounded bg-primary px-4 py-2 text-sm text-white"
        >
          Export to Excel
        </button>
      </div>
      <Table
        columns={laporanMusimanColumn}
        rowsData={dataLaporanMusiman}
        id="laporan-musiman-table"
        className="display hover max-w-full rounded-md bg-white"
      />
      {html`
        <script>
          $(document).ready(function () {
            $('#laporan-musiman-table').DataTable({
              scrollX: true,
            });

            $('#export-excel').click(function () {
              const wb = XLSX.utils.table_to_book(
                document.getElementById('laporan-musiman-table')
              );
              XLSX.writeFile(wb, 'laporan_musiman.xlsx');
            });
          });
        </script>
      `}
    </div>
  );
};
