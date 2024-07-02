import { SelectTanaman } from "../../../db/schema/tanaman";
import { html } from "hono/html";

const DataTanaman = ({ listTanaman }: { listTanaman: SelectTanaman[] }) => {
  return (
    <div class="grid p-5 shadow-inner">
      <table id="tanamanTable" class="row-border" style="width:100%">
        <thead>
          <tr>
            <th class="py-2 px-4 border-b border-gray-200" style="width: 5%">No.</th>
            <th class="py-2 px-4 border-b border-gray-200">Nama Tanaman</th>
          </tr>
        </thead>
        <tbody>
          {listTanaman.map((tanaman, index) => (
            <tr key={tanaman.id}>
              <td class="py-2 px-4 border-b border-gray-200" style="width: 5%">{index + 1}</td>
              <td class="py-2 px-4 border-b border-gray-200">{tanaman.nama_tanaman}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {html`
        <script>
          $(document).ready(function () {
            $('#tanamanTable').DataTable();
          });
        </script>
      `}
    </div>
  );
};

export default DataTanaman;
