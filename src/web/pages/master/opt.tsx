import { html } from 'hono/html';
import { AuthenticatedUser } from '../../components/profile.js';
import { ColumnHeader, Table } from '../../components/table.js';
import { SelectOPT } from '../../../db/schema/opt.js';

export type OptWithTanaman = {
  kode_opt: string;
  nama_opt: string;
  status: string;
  tanaman_id: number;
  nama_tanaman: string;
};

export const optColumn: ColumnHeader<SelectOPT & { nama_tanaman: string}>[] = [
  { headerName: "no", valueGetter: (_, index) => index + 1},
  { headerName: 'nama opt', field: 'nama_opt'},
  { field: 'jenis', headerName: 'jenis'},
  { headerName: 'komoditas', valueGetter: (row) => row.nama_tanaman},
  { field: 'status', headerName: 'status'},
  { field: 'kode_opt', headerName: 'kode'}
]

const DataOPT = ({
  listOpt,
  user,
}: {
  listOpt: OptWithTanaman[];
  user?: AuthenticatedUser;
}) => {
  return (
    <div class="grid p-5 shadow-inner">
      <Table id='optTable' className="rounded-md bg-white hover" columns={optColumn} rowsData={listOpt} />
      {html`
        <script>
          $(document).ready(function () {
            $('#optTable').DataTable();
          });
        </script>
      `}
      {!!user ? (
        <div>
          <button
            class="rounded bg-primary px-2 py-1 text-white"
            hx-get="/app/master/opt/create"
            hx-target="body"
            hx-swap="beforeend"
          >
            Add OPT
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default DataOPT;
