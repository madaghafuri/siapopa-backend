import { html } from 'hono/html';
import { AuthenticatedUser } from '../../components/profile.js';
import { ColumnHeader, Table } from '../../components/table.js';
import { SelectGolonganPestisida } from '../../../db/schema/golongan-pestisida.js';

export const golonganPestisidaColumn: ColumnHeader<SelectGolonganPestisida>[] = [
  { headerName: "no", valueGetter: (_, index) => index + 1},
  { headerName: 'golongan pestisida', field: 'nama_golongan'},
]

const DataGolonganPestisida = ({
  listGolonganPestisida,
  user,
}: {
  listGolonganPestisida: SelectGolonganPestisida[];
  user?: AuthenticatedUser;
}) => {
  return (
    <div class="grid p-5 shadow-inner">
      <Table id='golonganPestisidaTable' className="rounded-md bg-white hover" columns={golonganPestisidaColumn} rowsData={listGolonganPestisida} />
      {html`
        <script>
          $(document).ready(function () {
            $('#golonganPestisidaTable').DataTable();
          });
        </script>
      `}
    </div>
  );
};

export default DataGolonganPestisida;
