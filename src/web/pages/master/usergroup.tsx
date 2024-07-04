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
          </tr>
        </thead>
        <tbody>
          {listUserGroup.map((userGroup, index) => (
            <tr key={userGroup.id}>
              <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
                {index + 1}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {userGroup.group_name}
              </td>
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
          <button></button>
        </div>
      ) : null}
    </div>
  );
};

export default DataUserGroup;
