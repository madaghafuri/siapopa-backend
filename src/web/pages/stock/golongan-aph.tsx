import { SelectGolonganAph } from '../../../db/schema/golongan-aph';
import {
  CustomTable,
  TableBody,
  TableHeader,
} from '../../components/custom-table';
import { ColumnHeader } from '../../components/table';

export const golonganAphColumn: ColumnHeader<SelectGolonganAph>[] = [
  { headerName: 'no', valueGetter: (_, index) => index + 1 },
  { headerName: 'jenis', field: 'jenis' },
];

export const GolonganAphPage = ({
  golonganAphList,
}: {
  golonganAphList: SelectGolonganAph[];
}) => {
  return (
    <div class="p-5 shadow-inner">
      <button
        class="rounded-md bg-primary px-4 py-2 text-white shadow-lg"
        hx-get="/app/stock/aph/golongan-aph/create"
        hx-target="body"
        hx-swap="beforeend"
      >
        Tambah Golongan APH
      </button>
      <CustomTable>
        <TableHeader column={golonganAphColumn} />
        <TableBody
          column={golonganAphColumn}
          rowData={golonganAphList}
          //@ts-ignore
          class="bg-white shadow-lg"
          hx-get="/app/stock/aph/golongan-aph"
          hx-trigger="newGolonganAph from:body"
          hx-target="this"
          hx-swap="innerHTML"
        />
      </CustomTable>
    </div>
  );
};
