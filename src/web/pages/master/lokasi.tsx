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
    provinsi: Partial<Provinsi>;
    kabupaten_kota: Partial<KabupatenKota>;
    kecamatan: Partial<Kecamatan>;
    desa: Partial<Desa>;
    user?: SelectUser;
  }
>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { headerName: 'POPT', valueGetter: (row) => row?.user?.name },
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
  {
    headerName: 'aksi',
    valueGetter: (row) => {
      return (
        <div class="flex items-center justify-center">
          <button
            class="w-4 px-4 text-blue-500 hover:text-blue-700"
            hx-get={`/app/master/lokasi/edit/${row.id}`}
            hx-target="body"
            hx-swap="beforeend"
          >
            <i class="fa fa-edit"></i>
          </button>
          <button
            class="w-4 px-4 text-red-500 hover:text-red-700"
            hx-get={`/app/master/lokasi/delete/${row.id}`}
            hx-target="body"
            hx-swap="beforeend"
          >
            <i class="fa fa-trash"></i>
          </button>
        </div>
      );
    },
  },
];

export const LokasiPage = ({
  lokasiList,
  user,
}: {
  user: SelectUser;
  lokasiList: (Lokasi & {
    provinsi: Partial<Provinsi>;
    kabupaten_kota: Partial<KabupatenKota>;
    kecamatan: Partial<Kecamatan>;
    desa: Partial<Desa>;
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

      <div class="flex items-center justify-end gap-3">
        <label htmlFor="" class="text-sm font-medium">
          Alamat
        </label>
        <input
          type="text"
          name="alamat"
          class="rounded-md border border-gray-200 bg-white px-2 py-1 shadow-lg"
          hx-get="/app/master/lokasi"
          hx-target="#table-body"
          hx-swap="innerHTML"
          hx-include="[name='alamat']"
          hx-trigger="keyup changed delay:500ms"
          hx-indicator="#loading"
        />
      </div>
      <div class="rounded bg-soft">
        <table class="w-full max-w-full table-auto border-collapse rounded shadow-xl">
          <thead>
            <tr class="">
              {lokasiColumn.map((val) => {
                return (
                  <th class="px-2 py-1 text-sm font-semibold capitalize text-blue-500">
                    {val.headerName}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody
            id="table-body"
            hx-get="/app/master/lokasi"
            hx-trigger="newLokasi from:body"
            hx-target="this"
            hx-swap="innerHTML"
            class="bg-white text-slate-700"
          >
            {lokasiList.map((row, index) => {
              return (
                <tr class="border-y border-gray-200 hover:bg-zinc-100">
                  {lokasiColumn.map((col) => {
                    return (
                      <td class="px-4 py-2">
                        {col?.valueGetter?.(row, index) || row[col.field]}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-center">
        <i class="fa-solid fa-spinner htmx-loading" id="loading"></i>
      </div>
      <div class="flex items-center justify-between">
        <button
          hx-target="#table-body"
          hx-swap="innerHTML"
          hx-trigger="click"
          hx-indicator="#loading"
          class="rounded bg-white px-2 py-1"
          id="prev-btn"
        >
          Prev
        </button>
        <span id="page-num">1</span>
        <button
          hx-target="#table-body"
          hx-swap="innerHTML"
          hx-trigger="click"
          hx-indicator="#loading"
          class="rounded bg-white px-2 py-1"
          id="next-btn"
        >
          Next
        </button>
      </div>
      {html`
        <script>
          $(document).ready(function () {
            $('#lokasi-table').DataTable({
              top: false,
              bottom: false,
            });
            const url = new URL($(location).attr('href'));
            let currentPage = parseInt(url.searchParams.get('page')) || 1;

            function updatePagination() {
              $('#page-num').text(currentPage.toString());
            }

            $('#next-btn').click(function () {
              htmx.ajax(
                'GET',
                '/app/master/lokasi?page=' + (currentPage + 1).toString(),
                '#table-body'
              );
            });

            $('#prev-btn').click(function () {
              if (currentPage === 1) return;
              htmx.ajax(
                'GET',
                '/app/master/lokasi?page=' + (currentPage - 1).toString(),
                '#table-body'
              );
            });

            htmx.on('htmx:afterSettle', function (event) {
              const url = new URL(
                event.detail.pathInfo.requestPath,
                window.location.origin
              );
              const pageParam = url.searchParams.get('page');
              if (pageParam) {
                currentPage = parseInt(pageParam);
                $('#page-num').html(pageParam);
                updatePagination();
              }
            });
            updatePagination();
          });
        </script>
      `}
    </div>
  );
};
