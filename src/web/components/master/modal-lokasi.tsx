import { html } from 'hono/html';
import Modal, { ModalContent, ModalHeader } from '../modal';
import { Provinsi } from '../../../db/schema/provinsi';

export const ModalLokasi = ({
  provinsiOptions,
}: {
  provinsiOptions: Provinsi[];
}) => {
  return (
    <Modal>
      <ModalHeader>Create Lokasi</ModalHeader>
      <ModalContent>
        <form
          class="grid grid-cols-2 gap-3"
          hx-post="/app/master/lokasi"
          hx-target="#error-message"
          hx-swap="innerHTML"
          hx-trigger="submit"
        >
          <div class="flex flex-col gap-1">
            <label class="text-sm text-blue-700">
              ID <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              name="id"
              class="rounded border border-gray-800 px-2 py-1"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-blue-700">
              Alamat <span class="text-red-500">*</span>
            </label>
            <textarea
              type="text"
              required
              name="alamat"
              class="rounded border border-gray-800 px-2 py-1"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-blue-700">
              Kode Post <span class="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              name="kode_post"
              class="rounded border border-gray-800 px-2 py-1"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-blue-700">
              Provinsi <span class="text-red-500">*</span>
            </label>
            <select
              id="provinsi-options"
              required
              type="text"
              name="provinsi_id"
              class="rounded border border-gray-800 px-2 py-1"
              placeholder="Pilih Provinsi"
            >
              <option></option>
              {provinsiOptions.map((value) => (
                <option value={value.id}>{value.nama_provinsi}</option>
              ))}
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-blue-700">
              Kabupaten/Kota <span class="text-red-500">*</span>
            </label>
            <select
              id="kabkot-options"
              required
              type="text"
              name="kabkot_id"
              class="rounded border border-gray-800 px-2 py-1"
            >
              <option value=""></option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-blue-700">
              Kecamatan <span class="text-red-500">*</span>
            </label>
            <select
              id="kecamatan-options"
              required
              type="text"
              name="kecamatan_id"
              class="rounded border border-gray-800 px-2 py-1"
            >
              <option></option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-blue-700">
              Desa <span class="text-red-500">*</span>
            </label>
            <select
              id="desa-options"
              required
              type="text"
              name="desa_id"
              class="rounded border border-gray-800 px-2 py-1"
            >
              <option></option>
            </select>
          </div>
          <div id="error-message" class="col-span-2"></div>
          <button
            class="col-span-2 rounded bg-primary px-2 py-1 text-white"
            hx-indicator="#loading"
            type="submit"
          >
            <div id="loading">
              <p>Tambah Lokasi</p>
              <i class="fa-solid fa-spinner"></i>
            </div>
          </button>
        </form>
        {html`
          <script>
            $('#provinsi-options')
              .select2()
              .on('change', function (event) {
                htmx.ajax(
                  'GET',
                  '/app/master/kabkot?provinsi=' +
                    event.target.value.toString(),
                  '#kabkot-options'
                );
              });

            $('#kabkot-options')
              .select2()
              .on('change', function (event) {
                htmx.ajax(
                  'GET',
                  '/app/master/kecamatan?kabkot_id=' +
                    event.target.value.toString(),
                  '#kecamatan-options'
                );
              });

            $('#kecamatan-options')
              .select2()
              .on('change', function (event) {
                htmx.ajax(
                  'GET',
                  '/app/master/desa?kecamatan_id=' +
                    event.target.value.toString(),
                  '#desa-options'
                );
              });

            $('#desa-options').select2();
          </script>
        `}
      </ModalContent>
    </Modal>
  );
};
