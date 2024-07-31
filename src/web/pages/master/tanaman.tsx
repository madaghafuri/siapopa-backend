import { SelectTanaman } from '../../../db/schema/tanaman';
import { html } from 'hono/html';
import { AuthenticatedUser } from '../../components/profile';
import { ColumnHeader, Table } from '../../components/table';

export const columnTanaman: ColumnHeader<SelectTanaman>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { headerName: 'nama tanaman', field: 'nama_tanaman' },
  {
    headerName: 'aksi',
    valueGetter: (row) => (
      <div class="flex justify-center gap-1">
        <button
          hx-get={`/app/master/tanaman/edit/${row.id}`}
          hx-target="body"
          hx-swap="beforeend"
          class="cursor-pointer"
        >
          <i class="fa-solid fa-pen-to-square text-blue-500"></i>
        </button>
        <button
          hx-get={`/app/master/tanaman/delete/${row.id}`}
          hx-target="body"
          hx-swap="beforeend"
          class="cursor-pointer"
        >
          <i class="fa-solid fa-trash-can text-red-500"></i>
        </button>
      </div>
    ),
  },
];

const DataTanaman = ({
  listTanaman,
  user,
}: {
  listTanaman: SelectTanaman[];
  user?: AuthenticatedUser;
}) => {
  return (
    <div class="p-5 shadow-inner">
      <div
        id="container-tanaman-table"
        hx-get="/app/master/tanaman"
        hx-target="this"
        hx-swap="innerHTML"
        hx-trigger="reloadTanaman from:body"
      >
        <Table
          id="tanaman-table"
          className="display hover nowrap max-w-full rounded bg-white"
          columns={columnTanaman}
          rowsData={listTanaman}
        />
        {html`
          <script>
            $(document).ready(function () {
              $('#tanaman-table').DataTable({
                scrollX: true,
              });
            });
          </script>
        `}
      </div>
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
