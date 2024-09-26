import { html } from 'hono/html';
import { KabupatenKota } from '../../../db/schema/kabupaten-kota';
import { Kecamatan } from '../../../db/schema/kecamatan';
import { SelectOPT } from '../../../db/schema/opt';
import { SelectPeramalanKecamatan } from '../../../db/schema/peramalan-kecamatan';
import {
  CustomTable,
  TableBody,
  TableHeader,
} from '../../components/custom-table';
import { ColumnHeader } from '../../components/table';

export const columnHeaderPeramalanKecamatan: ColumnHeader<
  SelectPeramalanKecamatan & {
    kecamatan: Pick<Kecamatan, 'id' | 'nama_kecamatan'>;
    opt: SelectOPT;
  }
>[] = [
  {
    headerName: 'No',
    valueGetter(row, index) {
      return index + 1;
    },
  },
  {
    headerName: 'Kode Kecamatan',
    valueGetter(row) {
      return row.kecamatan.id;
    },
  },
  {
    headerName: 'Kecamatan',
    valueGetter(row, index) {
      return row.kecamatan.nama_kecamatan;
    },
  },
  {
    headerName: 'OPT',
    valueGetter: (row) => row.opt.nama_opt,
  },
  {
    headerName: 'MT',
    field: 'mt_prakiraan',
  },
  {
    headerName: 'Prakiraan KLTS',
    field: 'klts_prakiraan',
  },
];

export const columnPeramalanKecamatanByOPT: ColumnHeader<{
  opt_id: number;
  kode_opt: string;
  nama_opt: string;
  klts_sebelumnya: number;
  klts_antara: number;
  klts_prakiraan: number;
}>[] = [
  { headerName: 'No', valueGetter: (_, index) => index + 1 },
  { headerName: 'Kode OPT', field: 'kode_opt' },
  { headerName: 'OPT', field: 'nama_opt' },
  { headerName: 'KLTS Sebelumnya', field: 'klts_sebelumnya' },
  { headerName: 'KLTS Antara', field: 'klts_antara' },
  { headerName: 'KLTS Prakiraan', field: 'klts_prakiraan' },
];

export const PeramalanKecamatan = ({
  dataPeramalan,
  dataPeramalanOPT,
  kabkotOptions,
}: {
  dataPeramalan: (SelectPeramalanKecamatan & {
    kecamatan: Pick<Kecamatan, 'id' | 'nama_kecamatan'>;
  })[];
  dataPeramalanOPT: {
    opt_id: number;
    kode_opt: string;
    nama_opt: string;
    klts_sebelumnya: number;
    klts_antara: number;
    klts_prakiraan: number;
  }[];
  kabkotOptions: Pick<KabupatenKota, 'id' | 'nama_kabkot'>[];
}) => {
  return (
    <div class="flex flex-col gap-5 p-5 shadow-inner">
      <div>
        <button
          class="rounded bg-primary px-4 py-2 text-white"
          hx-get="/app/peramalan/kecamatan/create"
          hx-target="body"
          hx-swap="beforeend"
          hx-indicator="#loading"
        >
          Add Peramalan Kecamatan
        </button>
      </div>
      <div class="grid grid-cols-5 rounded-md bg-white p-5 shadow-lg">
        <div class="flex flex-col gap-1">
          <span class="text-sm font-semibold text-indigo-800">
            Kabupaten / Kota
          </span>
          <select id="kabkot-options">
            {kabkotOptions.map((val) => {
              return <option value={val.id}>{val.nama_kabkot}</option>;
            })}
          </select>
        </div>
      </div>
      <h1 class="text-xl font-bold">
        Prakiraan Serangan OPT Padi Spesifik Lokasi Kabupaten Bogor
      </h1>
      <CustomTable>
        <TableHeader column={columnPeramalanKecamatanByOPT} />
        <TableBody
          rowData={dataPeramalanOPT}
          column={columnPeramalanKecamatanByOPT}
          //@ts-ignore
          class="bg-white shadow-lg"
        />
      </CustomTable>

      <CustomTable>
        <TableHeader column={columnHeaderPeramalanKecamatan} />
        <TableBody
          rowData={dataPeramalan}
          column={columnHeaderPeramalanKecamatan}
          //@ts-ignore
          class="bg-white shadow-lg"
        />
      </CustomTable>
      {html`
        <script>
          $(document).ready(function () {
            $('#kabkot-options').select2();
          });
        </script>
      `}
    </div>
  );
};
