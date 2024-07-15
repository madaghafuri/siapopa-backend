import { html } from "hono/html"
import { LaporanSb } from "../../../db/schema/laporan-sb.js"
import { ColumnHeader } from "../../components/table.js"
import { SelectTanaman } from "../../../db/schema/tanaman.js"
import { Provinsi } from "../../../db/schema/provinsi.js"

export const columnLaporanSb: ColumnHeader<LaporanSb>[] = [
  { field: 'status_laporan_bulanan', headerName: 'status' },
  { field: 'note', headerName: 'note' },
  {
    field: 'sign_pic', headerName: 'signature', valueGetter: (row) => (
      <a href={row.sign_pic} target="_blank">
        <img class="w-10 h-10" src={row.sign_pic} alt="" />
      </a>
    )
  },
  { field: 'tanggal_laporan_sb', headerName: 'tgl laporan' },
  { field: 'luas_sembuh', headerName: 'luas sembuh' },
  { field: 'luas_panen', headerName: 'luas panen' },
  { field: 'freq_pengendalian', headerName: 'freq pengendalian' },
  { field: 'freq_nabati', headerName: 'freq nabati' },
  {
    headerName: 'aksi', valueGetter: (row) => (
      <a href={`/app/laporan/sb/${row.id}`}>
        <i class="fa-solid fa-circle-info"></i>
      </a>
    )
  }
]

export const LaporanSbPage = ({ laporanSbList, komoditasOption, provinsiOption }: {
  laporanSbList: LaporanSb[];
  komoditasOption: SelectTanaman[];
  provinsiOption: Provinsi[]
}) => {
  return (
    <div class="p-5 shadow-inner flex flex-col gap-5">
      <div
        hx-get="/app/laporan/sb/filter"
        hx-target="#body-laporan-sb"
        hx-swap="innerHTML"
        hx-trigger="click from:#submit-filter"
        hx-include="*"
        hx-push-url="true"
        class="bg-white p-5 rounded-md border-t-2 border-t-secondary grid grid-cols-4 gap-3">
        <select
          name="tanaman_id"
          class="rounded border border-gray-200 px-4 py-2"
        >
          <option value="">PILIH Komoditas</option>
          {komoditasOption.map((value) => {
            return <option value={value.id}>{value.nama_tanaman}</option>;
          })}
        </select>
        <select
          name="provinsi_id"
          class="rounded border border-gray-200 px-4 py-2"
        >
          <option value="">PILIH Provinsi</option>
          {provinsiOption.map((value) => {
            return <option value={value.id}>{value.nama_provinsi}</option>;
          })}
        </select>
        <input
          type="text"
          placeholder='Dari tanggal'
          name="start_date"
          onfocus="this.type='date'"
          onblur="this.type='text'"
          class="rounded border border-gray-200 px-4 py-2"
        />
        <input
          type="text"
          placeholder='Sampai tanggal'
          name="end_date"
          onfocus="this.type='date'"
          onblur="this.type='text'"
          class="rounded border border-gray-200 px-4 py-2"
        />
        <button
          id="submit-filter"
          type="button"
          class="rounded bg-primary px-4 py-2 text-white"
        >
          Filter
        </button>
      </div>
      <table id="laporan-sb-table" class="hover bg-white border-t-2 border-t-secondary" style="width:100%">
        <thead>
          <tr class="bg-slate-200">
            {columnLaporanSb.map((value) => {
              return <th class="border-b border-gray-200 px-4 py-2 capitalize text-sm font-medium text-blue-500">{value.headerName}</th>
            })}
          </tr>
        </thead>
        <tbody id="body-laporan-sb">
          {laporanSbList.map((row) => {
            return (
              <tr key={row.id}>
                {columnLaporanSb.map((column) => {
                  return <td class="border-b border-gray-200 text-center">{column?.valueGetter?.(row) || row[column.field]}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      {html`
        <script>
          $(document).ready(function() {
            $('#laporan-sb-table').DataTable();
          })
        </script>
      `}
    </div>
  )
}

export const LaporanSbDetailPage = ({ laporanSb }: { laporanSb: LaporanSb }) => {
  return (
    <div class="p-5 shadow-inner flex flex-col gap-5">
      <div>Data</div>
      <table id="laporan-harian-table" class="bg-white border-t-2 border-t-secondary" style="width:100%">
        <thead></thead>
        <tbody></tbody>
      </table>
      {html`
        <script>
          $(document).ready(function() {
            $('#laporan-harian-table').DataTable();
          })
        </script>
      `}
    </div>
  )
}
