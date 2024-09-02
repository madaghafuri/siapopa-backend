import { SelectBahanAktif } from '../../../db/schema/bahan-aktif';
import { Kecamatan } from '../../../db/schema/kecamatan';
import { SelectOPT } from '../../../db/schema/opt';
import { SelectRekomendasiPOPT } from '../../../db/schema/rekomendasi-popt';
import { SelectUser } from '../../../db/schema/user';
import {
  CustomTable,
  TableBody,
  TableHeader,
} from '../../components/custom-table';
import { ColumnHeader } from '../../components/table';

export const rekomendasiColumn: ColumnHeader<
  SelectRekomendasiPOPT & {
    opt: SelectOPT;
    bahan_aktif: SelectBahanAktif;
    popt: SelectUser;
    kecamatan: Kecamatan;
  }
>[] = [
  { headerName: 'no', valueGetter: (row, index) => index + 1 },
  {
    headerName: 'aksi',
    valueGetter: (row) => (
      <a target="_blank" href={row.surat_rekomendasi_popt}>
        <i class="fa-solid fa-file"></i>
      </a>
    ),
  },
];

export const RekomendasiPopt = ({
  rekomendasiData,
}: {
  rekomendasiData: (SelectRekomendasiPOPT & {
    opt: SelectOPT;
    bahan_aktif: SelectBahanAktif;
    popt: SelectUser;
    kecamatan: Kecamatan;
  })[];
}) => {
  return (
    <div class="p-5 shadow-inner">
      <CustomTable>
        <TableHeader column={rekomendasiColumn} />
        <TableBody column={rekomendasiColumn} rowData={rekomendasiData} />
      </CustomTable>
    </div>
  );
};
