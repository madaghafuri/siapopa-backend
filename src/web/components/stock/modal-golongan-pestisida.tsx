import Modal, { ModalContent, ModalHeader } from '../modal.js';
import { SelectGolonganPestisida } from '../../../db/schema/golongan-pestisida.js';

export const ModalGolonganPestisida = ({ golonganPestisida }: { golonganPestisida?: SelectGolonganPestisida }) => {
  const isEditing = !!golonganPestisida;

  return (
    <Modal>
      <ModalHeader>
        <h2 class="text-xl font-bold">{isEditing ? 'Edit' : 'Create'} Golongan Pestisida</h2>
      </ModalHeader>
      <ModalContent>
        <form
          class="flex flex-col gap-3"
          hx-post={isEditing ? `/app/stock/golongan-pestisida/edit/${golonganPestisida?.id}` : "/app/stock/golongan-pestisida"}
          hx-target="#error-message"
          hx-swap="innerHTML"
          hx-trigger="submit"
        >
          <div class="grid grid-cols-[30%,auto]">
            <label>Golongan Pestisida</label>
            <input
              type="text"
              name="nama_golongan"
              defaultValue={golonganPestisida?.nama_golongan || ''}
              value={golonganPestisida?.nama_golongan || ''}
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
