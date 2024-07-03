import { html } from 'hono/html';

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
            <th class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              No.
            </th>
            <th class="border-b border-gray-200 px-4 py-2" style="width: 15%">
              Kode OPT
            </th>
            <th class="border-b border-gray-200 px-4 py-2">Nama OPT</th>
            <th class="border-b border-gray-200 px-4 py-2">Status</th>
            <th class="border-b border-gray-200 px-4 py-2">Tanaman</th>
          </tr>
        </thead>
        <tbody>
          {listOpt.map((opt, index) => (
            <tr key={opt.kode_opt}>
              <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
                {index + 1}
              </td>
              <td class="border-b border-gray-200 px-4 py-2" style="width: 15%">
                {opt.kode_opt}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">{opt.nama_opt}</td>
              <td class="border-b border-gray-200 px-4 py-2">
                {opt.status === 'mutlak' ? 'Mutlak' : 'Tidak Mutlak'}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {opt.nama_tanaman}
              </td>
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
      <div>
        <button
          class="rounded bg-primary px-2 py-1 text-white"
          hx-get="/app/master/opt/create"
          hx-target="body"
          hx-swap="beforeend"
        >
          Add OPT
        </button>
      </div>
    </div>
  );
};

export default DataOPT;
