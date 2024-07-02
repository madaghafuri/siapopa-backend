import { SelectOPT } from "../../../db/schema/opt.js";
import { html } from "hono/html";

export type OptWithTanaman = {
  kode_opt: string;
  nama_opt: string;
  status: string;
  tanaman_id: number;
  nama_tanaman: string;
};

const DataOPT = ({ listOpt }: { listOpt: OptWithTanaman[] }) => {
  return (
    <div class="grid p-5 shadow-inner">
      <table id="optTable" class="row-border" style="width:100%">
        <thead>
          <tr>
            <th class="py-2 px-4 border-b border-gray-200">Kode OPT</th>
            <th class="py-2 px-4 border-b border-gray-200">Nama OPT</th>
            <th class="py-2 px-4 border-b border-gray-200">Status</th>
            <th class="py-2 px-4 border-b border-gray-200">Tanaman</th>
          </tr>
        </thead>
        <tbody>
          {listOpt.map((opt) => (
            <tr key={opt.kode_opt}>
              <td class="py-2 px-4 border-b border-gray-200">{opt.kode_opt}</td>
              <td class="py-2 px-4 border-b border-gray-200">{opt.nama_opt}</td>
              <td class="py-2 px-4 border-b border-gray-200">{opt.status === 'mutlak' ? 'Mutlak' : 'Tidak Mutlak'}</td>
              <td class="py-2 px-4 border-b border-gray-200">{opt.nama_tanaman}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {html`
        <script>
          $(document).ready(function () {
            $('#optTable').DataTable();
          });
        </script>
      `}
    </div>
  );
};

export default DataOPT;
