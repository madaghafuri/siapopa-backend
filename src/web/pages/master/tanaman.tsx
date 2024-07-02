const InputTanaman = () => {
  return (
    <div class="grid grid-cols-12 p-5 shadow-inner">
      <form
        hx-post="/app/input/tanaman"
        hx-trigger="submit"
        hx-swap="innerHTML"
        hx-target="#error-message"
        class="col-span-4 col-start-5 flex flex-col gap-5 rounded-md border p-10"
      >
        <div class="flex flex-col gap-3">
          <label htmlFor="">Nama Tanaman</label>
          <input
            type="text"
            name="nama_tanaman"
            required
            class="rounded border px-2 py-1"
          />
        </div>
        <div id="error-message"></div>
        <button
          type="submit"
          class="rounded-md bg-primary px-2 py-1 text-white"
        >
          Input
        </button>
      </form>
    </div>
  );
};

export default InputTanaman;
