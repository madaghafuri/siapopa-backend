import { html } from 'hono/html';
import { KabupatenKota } from '../../../db/schema/kabupaten-kota';
import { Provinsi } from '../../../db/schema/provinsi';
import { ColumnHeader, Table } from '../../components/table';

export const kabupatenKotaColumn: ColumnHeader<
  KabupatenKota & { provinsi: Provinsi }
>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { field: 'nama_kabkot', headerName: 'Kabupaten/Kota' },
  { headerName: 'Provinsi', valueGetter: (row) => row.provinsi.nama_provinsi },
];

export const KabupatenKotaPage = ({
  kabkotList,
}: {
  kabkotList: (Partial<KabupatenKota> & { provinsi: Provinsi })[];
}) => {
  return (
    <div class="flex flex-col gap-5 p-5 shadow-inner">
      <div class="rounded-md border-t-2 border-t-secondary bg-white p-3">
        <form
          hx-post="/app/master/kabkot"
          hx-trigger="submit"
          hx-encoding="multipart/form-data"
          class="grid grid-cols-3 items-center gap-5"
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
      <Table
        id="kabkot-table"
        columns={kabupatenKotaColumn}
        rowsData={kabkotList}
        className="hover display nowrap max-w-full rounded-md bg-white"
      />
      {html`
        <script>
          $(document).ready(function () {
            $('#kabkot-table').DataTable();
          });
        </script>
      `}
    </div>
  );
};
