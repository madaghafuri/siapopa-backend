import { SelectTanaman } from '../../../db/schema/tanaman.js';
import { html } from 'hono/html';
import { AuthenticatedUser } from '../../components/profile.js';

const DataTanaman = ({
  listTanaman,
  user,
}: {
  listTanaman: SelectTanaman[];
  user?: AuthenticatedUser;
}) => {
  return (
    <div class="grid p-5 shadow-inner">
      <table id="tanamanTable" class="row-border" style="width:100%">
        <thead>
          <tr>
            <th class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              No.
            </th>
            <th class="border-b border-gray-200 px-4 py-2">Nama Tanaman</th>
            {user && user.usergroup_id === 4 && (
              <th class="border-b border-gray-200 px-4 py-2" style="width: 10%">Actions</th>
            )}
          </tr>
        </thead>
        <tbody
          hx-get="/app/master/tanaman/reload"
          hx-trigger="newTanaman from:body"
        >
          {listTanaman.map((tanaman, index) => (
            <tr key={tanaman.id}>
              <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
                {index + 1}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {tanaman.nama_tanaman}
              </td>
              {user && user.usergroup_id === 4 && (
                <td class="border-b border-gray-200 px-4 py-2" style="width: 10%">
                  <div class="flex items-center space-x-2">
                    <button
                      class="text-blue-500 hover:text-blue-700 px-4"
                      hx-get={`/app/master/tanaman/edit/${tanaman.id}`}
                      hx-target="body"
                      hx-swap="beforeend"
                    >
                      <i class="fa fa-edit"></i>
                    </button>
                    <button
                      class="ml-2 text-red-500 hover:text-red-700 px-4"
                      hx-delete={`/app/master/tanaman/delete/${tanaman.id}`}
                      hx-target="#tanamanTable"
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
            $('#tanamanTable').DataTable();
          });
        </script>
      `}
      {!!user ? (
        <div>
          {user.usergroup_id === 4 && (
          <button
            class="rounded bg-primary px-2 py-1 text-white"
            hx-get="/app/master/tanaman/create"
            hx-swap="beforeend"
            hx-target="body"
          >
            Add Tanaman
          </button>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default DataTanaman;
