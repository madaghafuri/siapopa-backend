import { html } from 'hono/html';
import { KabupatenKota } from '../../../db/schema/kabupaten-kota';
import { SelectOPT } from '../../../db/schema/opt';
import { SelectPeramalan } from '../../../db/schema/peramalan';
import { ColumnHeader, Table } from '../../components/table';
import { FilterButton } from '../../components/filter-button';

type PeramalanByOpt = {
  kabkot_id: string;
  nama_kabkot: string;
  kode_opt: string;
  opt: string;
  klts_mt_2023: number;
  klts_mt_2024: number;
  mt_2024: {
    minimum: number;
    prakiraan: number;
    maksimum: number;
  };
  klts: number;
  rasio: number;
  rasio_max: number;
};
export const peramalanByOptColumn: ColumnHeader<
  Omit<PeramalanByOpt, 'kabkot_id' | 'nama_kabkot'>
>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { field: 'opt', headerName: 'opt' },
  { field: 'klts_mt_2023', headerName: 'KLTS MT 2023 (ha)' },
  { field: 'klts_mt_2024', headerName: 'KLTS MT 2023/2024 (ha)' },
  { headerName: 'maksimum', valueGetter: (row) => row.mt_2024.minimum },
  { headerName: 'prakiraan', valueGetter: (row) => row.mt_2024.prakiraan },
  { headerName: 'maksimum', valueGetter: (row) => row.mt_2024.maksimum },
  { field: 'klts', headerName: 'KLTS' },
  {
    headerName: 'aksi',
    valueGetter: (row) => (
      <a href={`/app/master/peramalan/${row.kode_opt}`}>
        <i class="fa-solid fa-circle-info text-primary"></i>
      </a>
    ),
  },
];

export const PeramalanPage = ({
  kabupatenData,
  optOption,
  peramalanDataByOptList,
}: {
  kabupatenData: Omit<KabupatenKota, 'area_kabkot' | 'point_kabkot'>[];
  optOption: SelectOPT[];
  peramalanDataByOptList: Omit<PeramalanByOpt, 'kabkot_id' | 'nama_kabkot'>[];
}) => {
  return (
    <div class="flex h-full flex-col gap-3 p-5 shadow-inner">
      <h1>Peramalan</h1>
      <div class="rounded-md border-t-2 border-t-secondary bg-white p-5">
        <form
          class="grid grid-cols-4 gap-5"
          hx-get="/app/master/peramalan"
          hx-params="*"
          hx-target="#prakiraan-serangan-opt"
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
        columns={peramalanByOptColumn}
        rowsData={peramalanDataByOptList}
        id="peramalan-opt-table"
        className="hover display nowrap max-w-full rounded-md bg-white"
      />
      <div id="prakiraan-serangan-opt" class="flex flex-col gap-3"></div>
      {html`
        <script>
          $(document).ready(function () {
            $('#peramalan-table').DataTable({
              scrollX: true,
            });
            $('#peramalan-opt-table').DataTable({
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

type PeramalanByKabKot = Omit<PeramalanByOpt, 'kode_opt' | 'opt'>;

export const peramalanColumnByKabKot: ColumnHeader<PeramalanByKabKot>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { headerName: 'kode', field: 'kabkot_id' },
  { headerName: 'Kabupaten/Kota', field: 'nama_kabkot' },
  { headerName: 'KLTS MT 2023 (ha)', field: 'klts_mt_2023' },
  { headerName: 'KLTS MT 2023/2024 (ha)', field: 'klts_mt_2024' },
  { headerName: 'KLTS (ha)', field: 'klts' },
  { headerName: 'rasio (%)', field: 'rasio' },
  { headerName: 'Rasio Maks (%)', field: 'rasio_max' },
];

export const PeramalanByKabKotPage = ({
  peramalanData,
}: {
  peramalanData: PeramalanByKabKot[];
}) => {
  return (
    <div class="flex flex-col gap-5 p-5 shadow-inner">
      <Table
        columns={peramalanColumnByKabKot}
        rowsData={peramalanData}
        id="peramalan-kabkot"
        className="display hover nowrap max-w-full rounded-md bg-white"
      />
      {html`
        <script>
          $(document).ready(function () {
            $('#peramalan-kabkot').DataTable({
              scrollX: true,
            });
          });
        </script>
      `}
    </div>
  );
};
