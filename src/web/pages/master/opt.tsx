import { html } from 'hono/html';
import { AuthenticatedUser } from '../../components/profile.js';
import { ColumnHeader, Table } from '../../components/table.js';
import { SelectOPT } from '../../../db/schema/opt.js';

export type OptWithTanaman = {
  id: number;
  kode_opt: string;
  nama_opt: string;
  status: string;
  tanaman_id: number;
  nama_tanaman: string;
};

export const optColumn: ColumnHeader<SelectOPT & { nama_tanaman: string}>[] = [
  { headerName: "no", valueGetter: (_, index) => index + 1},
  { headerName: 'nama opt', field: 'nama_opt'},
  { field: 'jenis', headerName: 'jenis'},
  { headerName: 'komoditas', valueGetter: (row) => row.nama_tanaman},
  { field: 'status', headerName: 'status'},
  { field: 'kode_opt', headerName: 'kode'}
]

const DataOPT = ({
  listOpt,
  user,
}: {
  listOpt: OptWithTanaman[];
  user?: AuthenticatedUser;
}) => {
  return (
    <div class="grid p-5 shadow-inner">
      <table id="optTable" class="row-border" style="width:100%">
        <thead>
          <tr>
            <th class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              No.
            </th>
            <th class="border-b border-gray-200 px-4 py-2">Kode OPT</th>
            <th class="border-b border-gray-200 px-4 py-2">Nama OPT</th>
            <th class="border-b border-gray-200 px-4 py-2">Status</th>
            <th class="border-b border-gray-200 px-4 py-2">Komoditas</th>
            {user && user.usergroup_id === 4 && (
              <th class="border-b border-gray-200 px-4 py-2" style="width: 10%">Actions</th>
            )} 
          </tr>
        </thead>
        <tbody
          hx-get="/app/master/opt/reload"
          hx-trigger="newOpt from:body"
        >
          {listOpt.map((opt, index) => (
            <tr key={opt.id}>
              <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
                {index + 1}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {opt.kode_opt}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {opt.nama_opt}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {opt.status === 'mutlak' ? 'Mutlak' : 'Tidak Mutlak'}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {opt.nama_tanaman}
              </td>
              {user && user.usergroup_id === 4 && (
                <td class="border-b border-gray-200 px-4 py-2" style="width: 10%">
                  <div class="flex items-center space-x-2">
                    <button
                      class="text-blue-500 hover:text-blue-700 px-4"
                      hx-get={`/app/master/opt/edit/${opt.id}`}
                      hx-target="body"
                      hx-swap="beforeend"
                    >
                      <i class="fa fa-edit"></i>
                    </button>
                    <button
                      class="ml-2 text-red-500 hover:text-red-700 px-4"
                      hx-delete={`/app/master/opt/delete/${opt.id}`}
                      hx-target="#optTable"
                      hx-swap="outerHTML"
                      hx-confirm="Are you sure you want to delete this item?"
                    >
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </td>
              )}
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
      {!!user ? (
        <div>
          {user && user.usergroup_id === 4 && (
          <button
            class="rounded bg-primary px-2 py-1 text-white"
            hx-get="/app/master/opt/create"
            hx-target="body"
            hx-swap="beforeend"
          >
            Add OPT
          </button>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default DataOPT;
