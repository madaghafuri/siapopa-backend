import { LaporanHarian } from '../../../db/schema/laporan-harian';
import { Pengamatan } from '../../../db/schema/pengamatan';
import { Lokasi } from '../../../db/schema/lokasi';
import { Provinsi } from '../../../db/schema/provinsi';
import { KabupatenKota } from '../../../db/schema/kabupaten-kota';
import { Kecamatan } from '../../../db/schema/kecamatan';
import { Desa } from '../../../db/schema/desa';
import { ColumnHeader, Table } from '../../components/table';
import { Select } from '../../components/select';
import { SelectTanaman } from '../../../db/schema/tanaman';

const columnHeaders: ColumnHeader<LaporanHarian>[] = [
  { headerName: 'status', field: 'status_laporan_sb' },
  { headerName: 'foto', field: 'sign_pic' },
  { headerName: 'tgl lapor', field: 'tanggal_laporan_harian' },
  { headerName: 'tgl kunjungan', field: 'sign_pic' },
  { headerName: 'POPT' },
  { headerName: 'wilayah' },
  { headerName: 'komoditas' },
  { headerName: 'varietas' },
  { headerName: 'umur tanam', span: '1' },
  { headerName: 'luas tanam', span: '2' },
  { headerName: 'penyebab' },
  { headerName: 'keterangan' },
  { headerName: 'pic' }
];

export type DataLaporanHarian = LaporanHarian & {
  pengamatan: Pengamatan; lokasi: Lokasi & {
    provinsi: Provinsi;
    kabupaten_kota: KabupatenKota;
    kecamatan: Kecamatan;
    desa: Desa
  }
}

const LaporanHarianPage = ({
  listLaporan,
  komoditasOption,
  provinsiOption,
}: {
  listLaporan: DataLaporanHarian[];
  komoditasOption: SelectTanaman[];
  provinsiOption: Provinsi[];
}) => {
  return (
    <div class="isolate flex flex-col gap-5 bg-background p-5 shadow-inner">
      <h1 class="text-lg font-bold">Filter</h1>
      <div
        hx-get="/app/laporan/harian/filter"
        hx-trigger="click from:#filter-submit"
        hx-include="*"
        hx-swap="innerHTML"
        hx-target="#table-body"
        class="grid w-full grid-cols-4 gap-5 rounded border border-t-2 border-gray-200 border-t-secondary bg-white p-3 shadow-xl"
      >
        <Select
          name="tanaman_id"
          //@ts-ignore
          class="rounded border border-gray-200 px-4 py-2"
        >
          <option value="">PILIH Komoditas</option>
          {komoditasOption.map((value) => {
            return <option value={value.id}>{value.nama_tanaman}</option>;
          })}
        </Select>
        <Select
          name="provinsi_id"
          //@ts-ignore
          class="rounded border border-gray-200 px-4 py-2"
        >
          <option value="">PILIH Provinsi</option>
          {provinsiOption.map((value) => {
            return <option value={value.id}>{value.nama_provinsi}</option>;
          })}
        </Select>
        <input
          type="date"
          placeholder='Dari tanggal'
          name="start_date"
          class="rounded border border-gray-200 px-4 py-2"
        />
        <input
          type="date"
          placeholder='Sampai tanggal'
          name="end_date"
          class="rounded border border-gray-200 px-4 py-2"
        />
        <button
          id="filter-submit"
          type="button"
          class="rounded bg-primary px-4 py-2 text-white"
        >
          Filter
        </button>
      </div>
      <Table
        rowsData={listLaporan}
        columns={columnHeaders}
        id="laporanTable"
        className="w-full overflow-x-scroll rounded border border-t-2 border-gray-200 border-t-secondary bg-white shadow-2xl"
      ></Table>
    </div>
  );
};
export default LaporanHarianPage;
