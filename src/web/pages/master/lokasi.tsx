import { html } from 'hono/html';
import { Desa } from '../../../db/schema/desa';
import { KabupatenKota } from '../../../db/schema/kabupaten-kota';
import { Kecamatan } from '../../../db/schema/kecamatan';
import { Lokasi } from '../../../db/schema/lokasi';
import { Provinsi } from '../../../db/schema/provinsi';
import { SelectUser } from '../../../db/schema/user';
import { ColumnHeader, Table } from '../../components/table';

export const lokasiColumn: ColumnHeader<
  Lokasi & {
    provinsi: Provinsi;
    kabupaten_kota: KabupatenKota;
    kecamatan: Kecamatan;
    desa: Desa;
    pic?: SelectUser;
  }
>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { headerName: 'popt', valueGetter: (row) => row?.pic?.name },
  { headerName: 'provinsi', valueGetter: (row) => row.provinsi.nama_provinsi },
  {
    headerName: 'kabupaten',
    valueGetter: (row) => row.kabupaten_kota.nama_kabkot,
  },
  {
    headerName: 'kecamatan',
    valueGetter: (row) => row.kecamatan.nama_kecamatan,
  },
  { headerName: 'desa', valueGetter: (row) => row.desa.nama_desa },
  { field: 'alamat', headerName: 'alamat' },
  { field: 'kode_post', headerName: 'kode post' },
];

export const LokasiPage = ({
  lokasiList,
  user,
}: {
  user: SelectUser;
  lokasiList: (Lokasi & {
    provinsi: Provinsi;
    kabupaten_kota: KabupatenKota;
    kecamatan: Kecamatan;
    desa: Desa;
    pic?: SelectUser;
  })[];
}) => {
  return (
    <div class="flex flex-col gap-5 p-5 shadow-inner" x-data="{ page: 1 }">
      <button
        type="button"
        hx-get="/app/master/lokasi/create"
        hx-target="body"
        hx-swap="beforeend"
        class="max-w-40 rounded bg-primary px-2 py-1 text-white"
      >
        Add Data
      </button>
      {/* <Table
        columns={lokasiColumn}
        rowsData={lokasiList}
        id="lokasi-table"
        className="hover rounded-md bg-white"
      /> */}
      <div class="flex items-center justify-end gap-3">
        <label htmlFor="" class="text-sm font-medium">
          Alamat
        </label>
        <input
          type="text"
          name="alamat"
          class="rounded-md border border-gray-200 bg-white px-2 py-1"
          hx-get="/app/master/lokasi"
          hx-target="#table-body"
          hx-swap="innerHTML"
          hx-include="[name='alamat']"
          hx-trigger="keyup changed delay:500ms"
          hx-indicator="#loading"
        />
      </div>
      <div class="rounded-md bg-white">
        <div class="grid grid-cols-8 bg-slate-400">
          {lokasiColumn.map((val) => {
            return <p class="px-2 py-1 capitalize">{val.headerName}</p>;
          })}
        </div>
        <div id="table-body">
          {lokasiList.map((row, index) => {
            return (
              <div class="grid grid-cols-8">
                {lokasiColumn.map((col) => {
                  return (
                    <p class="border-r border-t border-gray-200 px-2 py-1">
                      {col?.valueGetter?.(row, index) || row[col.field]}
                    </p>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div class="flex items-center justify-center">
          <i class="fa-solid fa-spinner htmx-loading" id="loading"></i>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <button
          hx-get="/app/master/lokasi"
          hx-target="#table-body"
          hx-swap="innerHTML"
          hx-include="[name='page']"
          hx-trigger="click"
          hx-indicator="#loading"
          name="page"
          value="1"
          class="rounded bg-white px-2 py-1"
          _="on click decrement @value on me"
          id="prev-btn"
        >
          Prev
        </button>
        <p x-text="page"></p>
        <button
          hx-get="/app/master/lokasi"
          hx-target="#table-body"
          hx-swap="innerHTML"
          hx-include="[name='page']"
          hx-trigger="click"
          hx-indicator="#loading"
          name="page"
          class="rounded bg-white px-2 py-1"
          value="1"
          _="on click increment @value on me"
          id="next-btn"
        >
          Next
        </button>
      </div>
      {!!user ? (
        <button type="button" class="rounded bg-primary px-2 py-1 text-white">
          Tambah Data
        </button>
      ) : null}
      {html`
        <script>
          $(document).ready(function () {
            $('#lokasi-table').DataTable({
              top: false,
              bottom: false,
            });
          });
        </script>
      `}
    </div>
  );
};
