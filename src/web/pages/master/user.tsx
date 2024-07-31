import { html } from 'hono/html';
import { ColumnHeader, Table } from '../../components/table';

export type UserData = {
  id: number;
  user_name: string;
  email: string;
  phone: string;
  photo: string;
  validasi: boolean;
  user_group: string;
};

export const userColumn: ColumnHeader<UserData>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { headerName: 'name', field: 'user_name' },
  { headerName: 'email', field: 'email' },
  { headerName: 'phone number', field: 'phone' },
  { headerName: 'user group', field: 'user_group' },
  {
    headerName: 'aktifasi',
    valueGetter: (row) => (
      <div
        class={`rounded-full px-2 py-1 text-center ${row.validasi ? 'bg-green-300 text-green-800' : 'bg-red-300 text-red-800'}`}
      >
        {row.validasi ? 'AKTIF' : 'INAKTIF'}
      </div>
    ),
  },
  {
    headerName: 'aksi',
    valueGetter: (row) => {
      return (
        <div class="flex justify-center gap-1">
          <div
            hx-get={`/app/master/user/edit/${row.id}`}
            hx-target="body"
            hx-swap="beforeend"
            class="cursor-pointer"
          >
            <i class="fa-solid fa-pen-to-square text-blue-500"></i>
          </div>
          <div
            hx-get={`/app/master/user/delete/${row.id}`}
            hx-target="body"
            hx-swap="beforeend"
            class="cursor-pointer"
          >
            <i class="fa-solid fa-trash-can text-red-500"></i>
          </div>
        </div>
      );
    },
  },
];

const DataUser = ({ listUser }: { listUser: UserData[] }) => {
  return (
    <div class="p-5 shadow-inner">
      <div
        id="user-table-container"
        hx-get="/app/master/user"
        hx-trigger="reloadUser from:body"
        hx-swap="innerHTML"
        hx-target="this"
      >
        <Table
          id="user-table"
          columns={userColumn}
          rowsData={listUser}
          className="display hover nowrap max-w-full rounded bg-white"
        />
        {html`
          <script>
            $(document).ready(function () {
              $('#user-table').DataTable({
                scrollX: true,
              });
            });
          </script>
        `}
      </div>
    </div>
  );
};
export default DataUser;
