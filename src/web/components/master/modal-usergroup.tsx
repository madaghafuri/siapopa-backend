import { SelectUserGroup } from "../../../db/schema/user-group.js"
import Modal, { ModalContent, ModalHeader } from "../modal.js"

export const ModalUserGroup = ({ usergroup }: { usergroup?: SelectUserGroup }) => {
  const isEditing = !!usergroup;

  return (
    <Modal>
      <ModalHeader>
      <h1 class="font-bold">{isEditing ? 'Edit' : 'Create'} User Group</h1>
      </ModalHeader>
      <ModalContent>
        <form
          class="flex flex-col gap-3"
          hx-post={isEditing ? `/app/master/usergroup/edit/${usergroup?.id}` : "/app/master/usergroup"}
          hx-target="#error-message"
          hx-swap="innerHTML"
          hx-trigger="submit"
        >
          <div class="grid grid-cols-[30%,auto]">
            <label>Nama Group</label>
            <input type="text" required name="group_name" value={usergroup?.group_name || ''} class="border rounded px-2 py-1" />
          </div>
          <div id="error-message"></div>
          <button type="submit" hx-indicator="#loading" class="rounded bg-primary px-2 py-1 text-white">
            <div id="loading">
              <p>{isEditing ? 'Update' : 'Create'}</p>
              <i class="fa-solid fa-spinner"></i>
            </div>
          </button>
        </form>
      </ModalContent>
    </Modal>
  )
}
