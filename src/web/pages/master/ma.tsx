import { SelectOPT } from '../../../db/schema/opt';
import { SelectTanaman } from '../../../db/schema/tanaman';
import {
  CustomTable,
  TableBody,
  TableHeader,
  TablePagination,
} from '../../components/custom-table';
import { ColumnHeader } from '../../components/table';

export const maColumn: ColumnHeader<SelectOPT & { tanaman: SelectTanaman }>[] =
  [
    { headerName: 'no', valueGetter: (_, index) => index + 1 },
    { headerName: 'kode opt', field: 'kode_opt' },
    { headerName: 'nama opt', field: 'nama_opt' },
    { field: 'jenis', headerName: 'jenis', valueGetter: (row) => row.jenis },
    { headerName: 'komoditas', valueGetter: (row) => row.tanaman.nama_tanaman },
    { field: 'status', headerName: 'status' },
    { field: 'kode_opt', headerName: 'kode' },
    {
      headerName: 'aksi',
      valueGetter: (row) => (
        <div class="flex items-center justify-center">
          <button
            class="px-4 text-blue-500 hover:text-blue-700"
            hx-get={`/app/master/ma/edit/${row.id}`}
            hx-target="body"
            hx-swap="beforeend"
          >
            <i class="fa fa-edit"></i>
          </button>
          <button
            class="ml-2 px-4 text-red-500 hover:text-red-700"
            hx-get={`/app/master/ma/delete/${row.id}`}
            hx-target="body"
            hx-swap="beforeend"
          >
            <i class="fa fa-trash"></i>
          </button>
        </div>
      ),
    },
  ];

export const MaPage = ({ maList }: { maList: SelectOPT[] }) => {
  return (
    <div class="flex flex-col gap-3 p-5">
      <CustomTable
        pagination={
          <TablePagination requestUrl="/app/master/ma" target="#table-body" />
        }
      >
        <TableHeader column={maColumn} />
        <TableBody
          id="table-body"
          column={maColumn}
          rowData={maList}
          //@ts-ignore
          class="bg-white"
          hx-get="/app/master/ma"
          hx-trigger="newMa from:body"
          hx-swap="innerHTML"
          hx-target="this"
        />
      </CustomTable>
    </div>
  );
};
