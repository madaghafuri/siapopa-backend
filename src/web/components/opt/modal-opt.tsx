import { SelectTanaman } from '../../../db/schema/tanaman.js';
import Modal, { ModalContent, ModalHeader } from '../modal.js';

export const ModalOpt = ({ listTanaman }: { listTanaman: SelectTanaman[] }) => {
  return (
    <Modal>
      <ModalHeader>
        <h2 class="text-xl font-bold">Create Opt</h2>
      </ModalHeader>
      <ModalContent>
        <form
          class="flex flex-col gap-3"
          hx-post="/app/master/opt"
          hx-target="#error-message"
          hx-swap="innerHTML"
          hx-trigger="submit"
        >
          <div class="grid grid-cols-[30%,auto]">
            <label>Opt</label>
            <input
              type="text"
              name="nama_opt"
              required
              class="rounded border px-2 py-1"
            />
          </div>
          <div class="grid grid-cols-[30%,auto]">
            <label>Kode Opt</label>
            <input
              type="text"
              name="kode_opt"
              required
              class="rounded border px-2 py-1"
            />
          </div>
          <div class="grid grid-cols-[30%,auto]">
            <label>Status </label>
            <select name="status" class="rounded border px-2 py-1">
              <option value="mutlak">Mutlak</option>
              <option value="tidak mutlak">Tidak Mutlak</option>
            </select>
          </div>
          <div class="grid grid-cols-[30%,auto]">
            <label>Tanaman</label>
            <select name="tanaman_id" class="rounded border px-2 py-1">
              {listTanaman.map((value) => {
                return <option value={value.id}>{value.nama_tanaman}</option>;
              })}
            </select>
          </div>
          <div id="error-message"></div>
          <button
            class="rounded bg-primary px-2 py-1 text-white"
            hx-indicator="#loading"
            type="submit"
          >
            <div id="loading">
              <p>Create</p>
              <i class="fa-solid fa-spinner"></i>
            </div>
          </button>
        </form>
      </ModalContent>
    </Modal>
  );
};
