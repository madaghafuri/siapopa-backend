import { html } from 'hono/html';
import { KabupatenKota } from '../../../db/schema/kabupaten-kota';
import { SelectOPT } from '../../../db/schema/opt';
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
export const PeramalanPage = ({
  kabupatenData,
  optOption,
  peramalanDataByOptList,
  peramalanDataByKabKotList,
}: {
  kabupatenData: Omit<KabupatenKota, 'area_kabkot' | 'point_kabkot'>[];
  optOption: SelectOPT[];
  peramalanDataByOptList: Omit<PeramalanByOpt, 'kabkot_id' | 'nama_kabkot'>[];
  peramalanDataByKabKotList: PeramalanByKabKot[];
}) => {
  return (
    <div class="flex h-full flex-col gap-3 p-5 shadow-inner">
      <h1 class="text-xl font-bold">Peramalan</h1>

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
      <div>
        <div class="grid grid-cols-4 rounded-md border-t-2 border-t-secondary bg-white">
          <div class="col-span-2 grid grid-cols-[40%,auto] p-5">
            <p>Provinsi</p>
            <p>Jawa Barat</p>
            <p>Tahun</p>
            <p>2024</p>
            <p>Musim/MT</p>
            <div class="grid grid-cols-2">
              <p>MK</p>
              <p>2024</p>
            </div>
            <p>OPT</p>
            <p>Utama</p>
          </div>
        </div>
        <Table
          rowsData={peramalanDataByKabKotList}
          columns={peramalanColumnByKabKot}
          id="peramalan-kabkot-table"
          className="display hover nowrap max-w-full rounded-md bg-white"
        />
      </div>
      <div id="prakiraan-serangan-opt" class="flex flex-col gap-3"></div>
      {html`
        <script>
          $(document).ready(function () {
            $('#peramalan-kabkot-table').DataTable({
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

export const PeramalanByKabKotPage = ({
  peramalanData,
}: {
  peramalanData: PeramalanByKabKot[];
}) => {
  return (
    <div class="flex flex-col gap-5 p-5 shadow-inner">
      <div>
        <button
          onclick="history.back()"
          class="rounded px-2 py-1 text-left text-xl hover:bg-zinc-300"
        >
          <i class="fa-solid fa-arrow-left-long"></i>
        </button>
      </div>
      <Table
        columns={peramalanColumnByKabKot}
        rowsData={peramalanData}
        id="peramalan-kabkot"
        className="display hover nowrap max-w-full rounded-md bg-white"
      />
      <canvas id="peramalan-kabkot-chart" class="bg-white"></canvas>
      {html`
        <script>
          $(document).ready(function () {
            $('#peramalan-kabkot').DataTable({
              scrollX: true,
            });
            const ctx = document.getElementById('peramalan-kabkot-chart');
            new Chart(ctx, {
              type: 'bar',
              data: {
                labels: ['Foo', 'Bar', 'Baz'],
                datasets: [
                  {
                    label: '# of votes',
                    data: [12, 9, 3, 4, 5, 2],
                  },
                ],
              },
            });
          });
        </script>
      `}
    </div>
  );
};
