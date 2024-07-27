import { html } from 'hono/html';
import { AuthenticatedUser } from '../../components/profile.js';
import { ColumnHeader, Table } from '../../components/table.js';
import { SelectGolonganPestisida } from '../../../db/schema/golongan-pestisida.js';

const DataGolonganPestisida = ({
  listGolonganPestisida,
  user,
}: {
  listGolonganPestisida: SelectGolonganPestisida[];
  user?: AuthenticatedUser;
}) => {
  return (
    <div class="grid p-5 shadow-inner">
      {!!user ? (
        <div>
          {user.usergroup_id === 5 && (
          <button
            class="rounded bg-primary px-2 py-1 text-white"
            hx-get="/app/stock/golongan-pestisida/create"
            hx-target="body"
            hx-swap="beforeend"
          >
            Add Golongan Pestisida
          </button>
          )}
        </div>
      ) : null}
      <table id="golonganPestisidaTable" class="border-t-2 border-t-secondary bg-white" style="width:100%">
        <thead>
          <tr>
            <th class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              No.
            </th>
            <th class="border-b border-gray-200 px-4 py-2">Golongan Pestisida</th>
            {user && user.usergroup_id === 5 && (
            <th class="border-b border-gray-200 px-4 py-2" style="width: 10%">Actions</th>
            )}
          </tr>
        </thead>
        <tbody
          hx-get="/app/stock/golongan-pestisida/reload"
          hx-trigger="newGolonganPestisida from:body"
        >
          {listGolonganPestisida.map((golongan, index) => (
            <tr key={golongan.id}>
              <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
                {index + 1}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {golongan.nama_golongan}
              </td>
              {user && user.usergroup_id === 5 && (
              <td class="border-b border-gray-200 px-4 py-2" style="width: 10%">
              <div class="flex items-center space-x-2">
                  <button
                    class="text-blue-500 hover:text-blue-700 px-4"
                    hx-get={`/app/stock/golongan-pestisida/edit/${golongan.id}`}
                    hx-target="body"
                    hx-swap="beforeend"
                    >
                      <i class="fa fa-edit"></i>
                    </button>
                    <button
                      class="ml-2 text-red-500 hover:text-red-700 px-4"
                      hx-delete={`/app/stock/golongan-pestisida/delete/${golongan.id}`}
                      hx-target="#golonganPestisidaTable"
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
            $('#golonganPestisidaTable').DataTable();
          });
        </script>
      `}
    </div>
  );
};

export default DataGolonganPestisida;
