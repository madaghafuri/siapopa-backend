export const KabupatenKotaPage = () => {
  return (
    <div class="flex flex-col gap-5 p-5 shadow-inner">
      <div class="rounded-md border-t-2 border-t-secondary bg-white p-3">
        <form
          hx-post="/app/master/kabkot"
          hx-swap="none"
          hx-trigger="submit"
          hx-encoding="multipart/form-data"
          class="grid grid-flow-col grid-cols-4 items-center gap-5"
        >
          <div class="grid max-w-full grid-cols-[20%,auto] items-center">
            <label class="truncate">Kabupaten/Kota</label>
            <input
              type="text"
              required
              name="nama_kabkot"
              class="rounded border border-gray-200 px-2 py-1"
            />
          </div>
          <div class="grid max-w-full grid-cols-[20%,auto] items-center">
            <label class="truncate">Kode</label>
            <input
              type="text"
              required
              name="id"
              class="rounded border border-gray-200 px-2 py-1"
            />
          </div>
          <input type="file" required name="geom" />
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
      </div>
    </div>
  );
};
