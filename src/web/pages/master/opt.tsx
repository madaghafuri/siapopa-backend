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

export const optColumn: ColumnHeader<SelectOPT & { nama_tanaman: string }>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { headerName: 'kode opt', field: 'kode_opt' },
  { headerName: 'nama opt', field: 'nama_opt' },
  { field: 'jenis', headerName: 'jenis', valueGetter: (row) => row.jenis },
  { headerName: 'komoditas', valueGetter: (row) => row.nama_tanaman },
  { field: 'status', headerName: 'status' },
  { field: 'kode_opt', headerName: 'kode' },
  {
    headerName: 'aksi',
    valueGetter: (row) => (
      <div class="flex items-center justify-center">
        <button
          class="px-4 text-blue-500 hover:text-blue-700"
          hx-get={`/app/master/opt/edit/${row.id}`}
          hx-target="body"
          hx-swap="beforeend"
        >
          <i class="fa fa-edit"></i>
        </button>
        <button
          class="ml-2 px-4 text-red-500 hover:text-red-700"
          hx-get={`/app/master/opt/delete/${row.id}`}
          hx-target="body"
          hx-swap="beforeend"
        >
          <i class="fa fa-trash"></i>
        </button>
      </div>
    ),
  },
];

const DataOPT = ({
  listOpt,
  user,
}: {
  listOpt: OptWithTanaman[];
  user?: AuthenticatedUser;
}) => {
  return (
    <div class="p-5 shadow-inner">
      <div
        id="container-opt"
        hx-get="/app/master/opt"
        hx-trigger="newOpt from:body"
        hx-swap="innerHTML"
        hx-target="this"
      >
        <Table
          id="opt-table"
          columns={optColumn}
          rowsData={listOpt}
          className="display hover nowrap max-w-full rounded-md bg-white"
        />
        {html`
          <script>
            $(document).ready(function () {
              $('#opt-table').DataTable({
                scrollX: true,
              });
            });
          </script>
        `}
      </div>

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
