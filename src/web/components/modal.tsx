export const ModalHeader = ({ children }: { children: any }) => {
  return <div class="border-b-[1px] px-3 py-2">{children}</div>;
};
export const ModalContent = ({ children }: { children: any }) => {
  return <div class="px-5 py-2">{children}</div>;
};

const Modal = ({ children }: { children: any[] }) => {
  return (
    <div
      id="modal"
      _="on closeModal add .closing then wait for animationend then remove me"
    >
      <div class="modal-underlay" _="on click trigger closeModal"></div>
      <div class="modal-content rounded-md">{children}</div>
    </div>
  );
};

export default Modal;
