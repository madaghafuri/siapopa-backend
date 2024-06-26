import { SelectTanaman } from "../../../db/schema/tanaman.js";

const InputHama = ({ listTanaman }: { listTanaman: SelectTanaman[] }) => {
  return (
    <div class="grid grid-cols-12 p-5 shadow-inner">
      <form
        hx-post="/app/input/hama"
        hx-trigger="submit"
        hx-swap="innerHTML"
        hx-target="#error-message"
        class="col-span-4 col-start-5 flex flex-col gap-5 rounded-md border p-5 shadow-lg"
      >
        <div class="flex flex-col gap-3">
          <label htmlFor="">Hama</label>
          <input
            type="text"
            name="hama"
            class="rounded border px-2 py-1"
            required
          />
        </div>
        <div class="flex flex-col gap-3">
          <label htmlFor="">Tanaman</label>
          <select
            name="tanaman_id"
            id=""
            class="rounded border px-2 py-1"
            required
          >
            {listTanaman.map((tanaman) => {
              return <option value={tanaman.id}>{tanaman.nama_tanaman}</option>;
            })}
          </select>
        </div>
        <div id="error-message"></div>
        <button type="submit" class="rounded bg-primary px-2 py-1 text-white">
          Input
        </button>
      </form>
    </div>
  );
};
export default InputHama;
