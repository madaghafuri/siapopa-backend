import { html } from "hono/html";
import { SelectUserGroup } from "../../../db/schema/user-group";

const DataUserGroup = ({ listUserGroup }: { listUserGroup: SelectUserGroup[] }) => {
  return (
    <div class="grid p-5 shadow-inner">
      <table id="usergroupTable" class="row-border" style="width:100%">
        <thead>
          <tr>
            <th class="py-2 px-4 border-b border-gray-200" style="width: 5%">No.</th>
            <th class="py-2 px-4 border-b border-gray-200">User Group</th>
          </tr>
        </thead>
        <tbody>
          {listUserGroup.map((userGroup, index) => (
            <tr key={userGroup.id}>
              <td class="py-2 px-4 border-b border-gray-200" style="width: 5%">{index + 1}</td>
              <td class="py-2 px-4 border-b border-gray-200">{userGroup.group_name}</td>
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
    </div>
  );
};

export default DataUserGroup;
