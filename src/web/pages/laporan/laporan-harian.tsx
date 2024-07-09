import { html } from 'hono/html';
import { LaporanHarian } from '../../../db/schema/laporan-harian';
import { Pengamatan } from '../../../db/schema/pengamatan';

const LaporanHarianPage = ({
  listLaporan,
}: {
  listLaporan: { laporan_harian: LaporanHarian; pengamatan: Pengamatan }[];
}) => {
  return (
    <div class="grid p-5 shadow-inner">
      <table id="laporanTable" class="row-border" style="width:100%">
        <thead>
          <tr>
            <th class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              No.
            </th>

            <th class="border-b border-gray-200 px-4 py-2">Nama OPT</th>
            <th class="border-b border-gray-200 px-4 py-2">Status</th>
            <th class="border-b border-gray-200 px-4 py-2">Tanaman</th>
          </tr>
        </thead>
        <tbody>
          {listLaporan.map((laporan, index) => {
            return (
              <tr key={laporan.laporan_harian.id}>
                <td>{laporan.laporan_harian.pengamatan_id}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {html`
        <script>
          $(document).ready(function () {
            $('#laporanTable').DataTable();
          });
        </script>
      `}
    </div>
  );
};
export default LaporanHarianPage;
