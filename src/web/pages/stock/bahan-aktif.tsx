import { html } from 'hono/html';
import { AuthenticatedUser } from '../../components/profile.js';
import { ColumnHeader, Table } from '../../components/table.js';
import { SelectBahanAktif } from '../../../db/schema/bahan-aktif.js';

export const bahanAktifColumn: ColumnHeader<SelectBahanAktif>[] = [
  { headerName: "no", valueGetter: (_, index) => index + 1, width: "5%"},
  { headerName: 'nama bahan aktif', field: 'nama_bahan'},
  { headerName: 'Actions' },
]

const DataBahanAktif = ({
  listBahanAktif,
  user,
}: {
  listBahanAktif: SelectBahanAktif[];
  user?: AuthenticatedUser;
}) => {
  return (
    <div class="grid p-5 shadow-inner">
      {!!user ? (
        <div>
          <button
            class="rounded bg-primary px-2 py-1 text-white"
            hx-get="/app/stock/bahan-aktif/create"
            hx-target="body"
            hx-swap="beforeend"
          >
            Add Bahan Aktif
          </button>
        </div>
      ) : null}
      <table id="bahanAktifTable" class="border-t-2 border-t-secondary bg-white" style="width:100%">
        <thead>
          <tr>
            <th class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              No.
            </th>
            <th class="border-b border-gray-200 px-4 py-2">Bahan Aktif</th>
            <th class="border-b border-gray-200 px-4 py-2" style="width: 10%">Actions</th>
          </tr>
        </thead>
        <tbody
          hx-get="/app/stock/bahan-aktif/reload"
          hx-trigger="newBahanAktif from:body"
        >
          {listBahanAktif.map((bahan, index) => (
            <tr key={bahan.id}>
              <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
                {index + 1}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {bahan.nama_bahan}
              </td>
              <td class="border-b border-gray-200 px-4 py-2" style="width: 10%">
              <div class="flex items-center space-x-2">
                  <button
                    class="text-blue-500 hover:text-blue-700 px-4"
                    hx-get={`/app/stock/bahan-aktif/edit/${bahan.id}`}
                    hx-target="body"
                    hx-swap="beforeend"
                    >
                      <i class="fa fa-edit"></i>
                    </button>
                    <button
                      class="ml-2 text-red-500 hover:text-red-700 px-4"
                      hx-delete={`/app/stock/bahan-aktif/delete/${bahan.id}`}
                      hx-target="#bahanAktifTable"
                      hx-swap="outerHTML"
                      hx-confirm="Are you sure you want to delete this item?"
                      >
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {html`
        <script>
          $(document).ready(function () {
            $('#bahanAktifTable').DataTable();
          });
        </script>
      `}
    </div>
  );
};

export default DataBahanAktif;
