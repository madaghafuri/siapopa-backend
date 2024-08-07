import { html } from 'hono/html';
import Modal, { ModalContent, ModalHeader } from '../modal';
import { lokasi, Lokasi } from '../../../db/schema/lokasi';
import { SelectUserGroup } from '../../../db/schema/user-group';

export const ModalUserCreate = ({
  lokasiOptions,
  userGroupOptions,
}: {
  lokasiOptions: Lokasi[];
  userGroupOptions: SelectUserGroup[];
}) => {
  return (
    <Modal>
      <ModalHeader>Create User</ModalHeader>
      <ModalContent>
        <form
          class="grid grid-cols-2 gap-3"
          hx-post="/app/master/user"
          hx-trigger="submit"
        >
          <div class="flex flex-col gap-1">
            <label htmlFor="" class="text-sm font-medium text-blue-700">
              Email <span class="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              name="email"
              class="rounded-md border border-gray-500 px-2 py-1"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label htmlFor="" class="text-sm font-medium text-blue-700">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              name="name"
              class="rounded-md border border-gray-500 px-2 py-1"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label htmlFor="" class="text-sm font-medium text-blue-700">
              Password <span class="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              required
              name="password"
              class="rounded-md border border-gray-500 px-2 py-1"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label htmlFor="" class="text-sm font-medium text-blue-700">
              Confirm Password <span class="text-red-500">*</span>
            </label>
            <input
              id="confirm-password"
              type="password"
              class="rounded-md border border-gray-500 px-2 py-1"
              required
            />
          </div>
          <div class="flex flex-col gap-1">
            <label htmlFor="" class="text-sm font-medium text-blue-700">
              Profile Photo
            </label>
            <input
              type="file"
              class="rounded-md border border-gray-500"
              name="photo"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label htmlFor="" class="text-sm font-medium text-blue-700">
              Phone
            </label>
            <input
              type="tel"
              class="rounded-md border border-gray-500 px-2 py-1"
              name="phone"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-bold text-blue-700">Validasi</label>
            <label class="switch">
              <input type="checkbox" name="validasi" />
              <span class="slider round"></span>
            </label>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-bold text-blue-700">Lokasi</label>
            <select name="lokasi_id[]" multiple id="lokasi-options">
              {lokasiOptions.map((value) => (
                <option value={value.id}>{value.alamat}</option>
              ))}
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-bold text-blue-700">User Group</label>
            <select name="usergroup_id" id="usergroup-options">
              {userGroupOptions.map((value) => (
                <option value={value.id}>{value.group_name}</option>
              ))}
            </select>
          </div>
          <span id="message" class="col-span-2 text-sm text-red-500"></span>
          <button
            class="col-span-2 rounded bg-primary px-2 py-1 text-white"
            hx-indicator="#loading"
            type="submit"
          >
            <div id="loading">
              <p>Submit</p>
              <i class="fa-solid fa-spinner"></i>
            </div>
          </button>
        </form>
        {html`
          <script>
            $('#lokasi-options').select2();
            $('#usergroup-options').select2();
            $('#confirm-password').on('keyup', function () {
              if ($('#password').val() !== $('#confirm-password').val()) {
                $('#message').html('password yang dimasukkan berbeda');
              } else if (
                $('#password').val() === $('#confirm-password').val()
              ) {
                $('#message').empty();
              }
            });
          </script>
        `}
      </ModalContent>
    </Modal>
  );
};
