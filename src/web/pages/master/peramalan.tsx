import { html } from 'hono/html';
import { KabupatenKota } from '../../../db/schema/kabupaten-kota';
import { SelectOPT } from '../../../db/schema/opt';
import { SelectPeramalan } from '../../../db/schema/peramalan';
import { ColumnHeader, Table } from '../../components/table';
import { FilterButton } from '../../components/filter-button';

export const peramalanColumn: ColumnHeader<
  SelectPeramalan & {
    opt: SelectOPT;
    kabupaten_kota: Omit<KabupatenKota, 'point_kabkot' | 'area_kabkot'>;
  }
>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { headerName: 'opt', valueGetter: (row) => row.opt?.nama_opt },
  {
    headerName: 'kabupaten',
    valueGetter: (row) => row.kabupaten_kota?.nama_kabkot,
  },
  { headerName: 'tahun sebelumnya', field: 'tahun_sebelumnya' },
  { headerName: 'klts sebelumnya', field: 'klts_sebelumnya' },
  { headerName: 'tahun antara', field: 'tahun_antara' },
  { headerName: 'klts antara', field: 'klts_antara' },
  { headerName: 'mt', field: 'mt' },
  { headerName: 'mt tahun', field: 'mt_tahun' },
  { headerName: 'mt minimum', field: 'mt_min' },
  { headerName: 'mt prakiraan', field: 'mt_prakiraan' },
  { headerName: 'mt maximum', field: 'mt_max' },
  { headerName: 'klts', field: 'klts' },
  { headerName: 'rasio', field: 'rasio' },
  { headerName: 'rasio maximum', field: 'rasio_max' },
];

export const PeramalanPage = ({
  peramalanData,
  kabupatenData,
  optOption,
}: {
  peramalanData: SelectPeramalan[];
  kabupatenData: Omit<KabupatenKota, 'area_kabkot' | 'point_kabkot'>[];
  optOption: SelectOPT[];
}) => {
  return (
    <div class="flex flex-col gap-3 p-5 shadow-inner">
      <h1>Peramalan</h1>
      <div class="rounded-md border-t-2 border-t-secondary bg-white p-5">
        <form
          class="grid grid-cols-4 gap-5"
          hx-get="/app/master/peramalan"
          hx-params="*"
          hx-target="#table-body"
          hx-trigger="submit"
          hx-swap="innerHTML"
        >
          <div class="flex flex-col gap-1">
            <label htmlFor="" class="text-sm font-bold text-blue-700">
              Kabupaten
            </label>
            <select
              id="kabkot-dropdown"
              multiple
              name="kabkot_id[]"
              class="rounded px-2 py-1"
            >
              {kabupatenData.map((kabkot) => {
                return <option value={kabkot.id}>{kabkot.nama_kabkot}</option>;
              })}
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-bold text-blue-700">Opt</label>
            <select id="opt-dropdown" multiple name="kode_opt[]">
              {optOption.map((opt) => {
                return <option value={opt.kode_opt}>{opt.nama_opt}</option>;
              })}
            </select>
          </div>
          <FilterButton />
        </form>
      </div>
      <Table
        columns={peramalanColumn}
        rowsData={peramalanData}
        id="peramalan-table"
        className="hover display nowrap max-w-full rounded-md bg-white"
      />
      {html`
        <script>
          $(document).ready(function () {
            $('#peramalan-table').DataTable({
              scrollX: true,
            });
            $('#kabkot-dropdown').chosen();
            $('#opt-dropdown').chosen();
          });
        </script>
      `}
    </div>
  );
};
