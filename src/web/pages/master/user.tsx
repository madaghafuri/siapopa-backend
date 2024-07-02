import { html } from "hono/html";

export type UserData = {
    user_name: string,
    email: string,
    phone: string,
    photo: string,
    validasi: boolean,
    user_group: string
};

const DataUser = ({ listUser }: { listUser: UserData[] }) => {
  return (
    <div class="grid p-5 shadow-inner">
      <table id="userTable" class="row-border" style="width:100%">
        <thead>
          <tr>
            <th class="py-2 px-4 border-b border-gray-200" style="width: 5%">No.</th>
            <th class="py-2 px-4 border-b border-gray-200">Name</th>
            <th class="py-2 px-4 border-b border-gray-200">Email</th>
            <th class="py-2 px-4 border-b border-gray-200">Phone Number</th>
            <th class="py-2 px-4 border-b border-gray-200">User Group</th>
            <th class="py-2 px-4 border-b border-gray-200">Validation</th>
          </tr>
        </thead>
        <tbody>
          {listUser.map((user, index) => (
            <tr key={user.email}>
              <td class="py-2 px-4 border-b border-gray-200" style="width: 5%">{index + 1}</td>
              <td class="py-2 px-4 border-b border-gray-200">{user.user_name}</td>
              <td class="py-2 px-4 border-b border-gray-200">{user.email}</td>
              <td class="py-2 px-4 border-b border-gray-200">{user.phone}</td>
              <td class="py-2 px-4 border-b border-gray-200">{user.user_group}</td>
              <td class="py-2 px-4 border-b border-gray-200">
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
    </div>
  );
};
export default DataUser;
