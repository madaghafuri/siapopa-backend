import Modal, { ModalContent, ModalHeader } from "../modal.js"

export const ModalUserGroup = () => {
  return (
    <Modal>
      <ModalHeader>
        Create User Group
      </ModalHeader>
      <ModalContent>
        <form
          class="flex flex-col gap-3"
          hx-post="/app/master/usergroup"
          hx-target="#error-message"
          hx-swap="innerHTML"
          hx-trigger="submit"
        >
          <div class="grid grid-cols-[30%,auto]">
            <label>Nama Group</label>
            <input type="text" required name="group_name" class="border rounded px-2 py-1" />
          </div>
          <div id="error-message"></div>
          <button type="submit" hx-indicator="#loading" class="rounded bg-primary px-2 py-1 text-white">
            <div id="loading">
              <p>Create</p>
              <i class="fa-solid fa-spinner"></i>
            </div>
          </button>
        </form>
      </ModalContent>
    </Modal>
  )
}
