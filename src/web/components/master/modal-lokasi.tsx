import Modal, { ModalContent, ModalHeader } from '../modal';

export const ModalLokasi = () => {
  return (
    <Modal>
      <ModalHeader>Create Lokasi</ModalHeader>
      <ModalContent>
        <form>
          <div class="grid grid-cols-[40%,auto]"></div>
        </form>
      </ModalContent>
    </Modal>
  );
};
