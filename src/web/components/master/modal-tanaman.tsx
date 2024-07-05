import Modal, { ModalContent, ModalHeader } from '../modal.js';

export const ModalTanaman = () => {
  return (
    <Modal>
      <ModalHeader>
        <h1 class="font-bold">Create Tanaman</h1>
      </ModalHeader>
      <ModalContent>
        <form
          class="flex flex-col gap-5"
          hx-post="/app/master/tanaman"
          hx-target="#error-message"
          hx-swap="innerHTML"
          hx-trigger="submit"
        >
          <div class="grid grid-cols-[30%,auto]">
            <label>Nama Tanaman</label>
            <input
              type="text"
              name="nama_tanaman"
              class="rounded border px-2 py-1"
            />
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
