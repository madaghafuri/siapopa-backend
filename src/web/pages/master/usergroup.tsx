import { html } from 'hono/html';
import { SelectUserGroup } from '../../../db/schema/user-group.js';
import { AuthenticatedUser } from '../../components/profile.js';

const DataUserGroup = ({
  listUserGroup,
  user,
}: {
  listUserGroup: SelectUserGroup[];
  user?: AuthenticatedUser;
}) => {
  return (
    <div class="grid p-5 shadow-inner">
      <table id="usergroupTable" class="row-border" style="width:100%">
        <thead>
          <tr>
            <th class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              No.
            </th>
            <th class="border-b border-gray-200 px-4 py-2">User Group</th>
            {user && user.usergroup_id === 4 && (
            <th class="border-b border-gray-200 px-4 py-2" style="width: 10%">Actions</th>
            )}
          </tr>
        </thead>
        <tbody hx-get="/app/master/usergroup/reload" hx-trigger="newUserGroup from:body">
          {listUserGroup.map((userGroup, index) => (
            <tr key={userGroup.id}>
              <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
                {index + 1}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {userGroup.group_name}
              </td>
              {user && user.usergroup_id === 4 && (
              <td class="border-b border-gray-200 px-4 py-2" style="width: 10%">
                  <div class="flex items-center space-x-2">
                    <button
                      class="text-blue-500 hover:text-blue-700 px-4"
                      hx-get={`/app/master/usergroup/edit/${userGroup.id}`}
                      hx-target="body"
                      hx-swap="beforeend"
                    >
                      <i class="fa fa-edit"></i>
                    </button>
                    <button
                      class="ml-2 text-red-500 hover:text-red-700 px-4"
                      hx-delete={`/app/master/usergroup/delete/${userGroup.id}`}
                      hx-target="#usergroupTable"
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
            $('#usergroupTable').DataTable();
          });
        </script>
      `}
      {!!user ? (
        <div>
          {user.usergroup_id === 4 && (
          <button
            hx-get="/app/master/usergroup/create"
            hx-target="body"
            hx-swap="beforeend"
            class="rounded px-2 py-1 bg-primary text-white"
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
