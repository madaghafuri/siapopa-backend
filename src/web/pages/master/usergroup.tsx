import { html } from 'hono/html';
import { SelectUserGroup } from '../../../db/schema/user-group.js';
import { AuthenticatedUser } from '../../components/profile.js';
import { ColumnHeader, Table } from '../../components/table.js';

export const userGroupColumn: ColumnHeader<SelectUserGroup>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { field: 'group_name', headerName: 'User Group' },
  {
    headerName: 'Aksi',
    valueGetter: (row) => (
      <div class="flex items-center justify-center">
        <button
          class="px-4 text-blue-500 hover:text-blue-700"
          hx-get={`/app/master/usergroup/edit/${row.id}`}
          hx-target="body"
          hx-swap="beforeend"
        >
          <i class="fa fa-edit"></i>
        </button>
        <button
          class="ml-2 px-4 text-red-500 hover:text-red-700"
          hx-get={`/app/master/usergroup/delete/${row.id}`}
          hx-target="body"
          hx-swap="beforeend"
        >
          <i class="fa fa-trash"></i>
        </button>
      </div>
    ),
  },
];

const DataUserGroup = ({
  listUserGroup,
  user,
}: {
  listUserGroup: SelectUserGroup[];
  user?: AuthenticatedUser;
}) => {
  return (
    <div class="grid p-5 shadow-inner">
      <div
        id="container-user-group"
        hx-get="/app/master/usergroup"
        hx-trigger="newUserGroup from:body"
        hx-swap="innerHTML"
        hx-target="this"
      >
        <Table
          id="user-group-table"
          columns={userGroupColumn}
          rowsData={listUserGroup}
          className="hover display nowrap max-w-full rounded bg-white"
        />
        {html`
          <script>
            $(document).ready(function () {
              $('#user-group-table').DataTable();
            });
          </script>
        `}
      </div>

      {!!user ? (
        <div>
          {user.usergroup_id === 4 && (
            <button
              hx-get="/app/master/usergroup/create"
              hx-target="body"
              hx-swap="beforeend"
              class="rounded bg-primary px-2 py-1 text-white"
            >
              Add User Group
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default DataUserGroup;
