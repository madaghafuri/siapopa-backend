import { html } from 'hono/html';
import { AuthenticatedUser } from '../../components/profile.js';

export type UserData = {
  user_name: string;
  email: string;
  phone: string;
  photo: string;
  validasi: boolean;
  user_group: string;
};

const DataUser = ({
  listUser,
  user,
}: {
  listUser: UserData[];
  user?: AuthenticatedUser;
}) => {
  return (
    <div class="grid p-5 shadow-inner">
      <table id="userTable" class="row-border" style="width:100%">
        <thead>
          <tr>
            <th class="border-b border-gray-200 px-4 py-2" style="width: 5%">
              No.
            </th>
            <th class="border-b border-gray-200 px-4 py-2">Name</th>
            <th class="border-b border-gray-200 px-4 py-2">Email</th>
            <th class="border-b border-gray-200 px-4 py-2">Phone Number</th>
            <th class="border-b border-gray-200 px-4 py-2">User Group</th>
            <th class="border-b border-gray-200 px-4 py-2">Validation</th>
          </tr>
        </thead>
        <tbody>
          {listUser.map((user, index) => (
            <tr key={user.email}>
              <td class="border-b border-gray-200 px-4 py-2" style="width: 5%">
                {index + 1}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {user.user_name}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">{user.email}</td>
              <td class="border-b border-gray-200 px-4 py-2">{user.phone}</td>
              <td class="border-b border-gray-200 px-4 py-2">
                {user.user_group}
              </td>
              <td class="border-b border-gray-200 px-4 py-2">
                {user.validasi ? 'Sudah' : 'Belum'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {html`
        <script>
          $(document).ready(function () {
            $('#userTable').DataTable();
          });
        </script>
      `}
      {!!user ? (
        <div>
          <button
            class="rounded bg-primary px-2 py-1 text-white"
            hx-get="/app/master/user/create"
            hx-target="body"
            hx-swap="beforeend"
          >
            Add Tanaman
          </button>
        </div>
      ) : null}
    </div>
  );
};
export default DataUser;
