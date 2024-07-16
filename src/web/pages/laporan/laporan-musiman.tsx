import { html } from 'hono/html';
import { LaporanMusiman } from '../../../db/schema/laporan-musiman.js';
import { ColumnHeader, Table } from '../../components/table.js';

const laporanMusimanColumn: ColumnHeader<LaporanMusiman>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { field: 'note', headerName: 'note' },
  { field: 'sign_pic', headerName: 'signature' },
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
      <Table
        columns={laporanMusimanColumn}
        rowsData={dataLaporanMusiman}
        id="laporan-musiman-table"
      />
      {html`
        <script>
          $(document).ready(function () {
            $('#laporan-musiman-table').DataTable();
          });
        </script>
      `}
    </div>
  );
};
