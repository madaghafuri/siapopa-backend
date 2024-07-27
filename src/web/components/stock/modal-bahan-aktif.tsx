import Modal, { ModalContent, ModalHeader } from '../modal.js';
import { SelectBahanAktif } from '../../../db/schema/bahan-aktif.js';

export const ModalBahanAktif = ({ bahanAktif }: { bahanAktif?: SelectBahanAktif }) => {
  const isEditing = !!bahanAktif;

  return (
    <Modal>
      <ModalHeader>
        <h2 class="text-xl font-bold">{isEditing ? 'Edit' : 'Create'} Bahan Aktif</h2>
      </ModalHeader>
      <ModalContent>
        <form
          class="flex flex-col gap-3"
          hx-post={isEditing ? `/app/stock/bahan-aktif/edit/${bahanAktif?.id}` : "/app/stock/bahan-aktif"}
          hx-target="#error-message"
          hx-swap="innerHTML"
          hx-trigger="submit"
        >
          <div class="grid grid-cols-[30%,auto]">
            <label>Bahan Aktif</label>
            <input
              type="text"
              name="nama_bahan"
              defaultValue={bahanAktif?.nama_bahan || ''}
              value={bahanAktif?.nama_bahan || ''}
              required
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
              <p>{isEditing ? 'Update' : 'Create'}</p>
              <i class="fa-solid fa-spinner"></i>
            </div>
          </button>
        </form>
      </ModalContent>
    </Modal>
  );
};
