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
    <div class="p-5 shadow-inner">
      <button
        type="button"
        hx-get="/app/master/lokasi/create"
        hx-target="body"
        hx-swap="beforeend"
        class="rounded bg-primary px-2 py-1 text-white"
      >
        Add Data
      </button>
      <Table
        columns={lokasiColumn}
        rowsData={lokasiList}
        id="lokasi-table"
        className="hover rounded-md bg-white"
      />
      {!!user ? (
        <button type="button" class="rounded bg-primary px-2 py-1 text-white">
          Tambah Data
        </button>
      ) : null}
      {html`
        <script>
          $(document).ready(function () {
            $('#lokasi-table').DataTable();
          });
        </script>
      `}
    </div>
  );
};
