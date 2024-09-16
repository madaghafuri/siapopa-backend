import { SelectPengajuanPestisida } from '../../db/schema/pengajuan-pestisida';
import { SelectRekomendasiPOPT } from '../../db/schema/rekomendasi-popt';
import { resolve } from 'path';
import { SelectOPT } from '../../db/schema/opt';
import { mkdirSync, createWriteStream } from 'node:fs';
import { SelectUser } from '../../db/schema/user';
import PdfMake from 'pdfmake';

export const generateSuratPengajuanPestisida = async (
  data: SelectPengajuanPestisida & {
    rekomendasi_popt: (SelectRekomendasiPOPT & {
      kecamatan: string;
      opt: SelectOPT;
      total_luas_serangan: number;
    })[];
    brigade: Omit<SelectUser, 'password'>;
  }
) => {
  const uploadPath = resolve('uploads', 'pengajuan', 'pestisida');
  const [day, month, year] = new Date(data.tanggal_pengajuan)
    .toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
    .split('/');
  const fileName = `PBP_${year}${month}${day}_${data.id}.pdf`;
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://sitampanparat.com'
      : 'http://localhost:3000';
  const fileUrlPath = baseUrl + '/uploads/pengajuan/pestisida/' + fileName;

  if (!(await Bun.file(uploadPath).exists())) {
    mkdirSync(uploadPath, { recursive: true });
  }
  const ws = createWriteStream(resolve(uploadPath, fileName));

  const filteredKeys = [
    'varietas',
    'umur_tanaman',
    'opt',
    'total_luas_serangan',
    'ambang_lampau_pengendalian',
  ];

  const mappedRekomendasi = data.rekomendasi_popt.map((rekomendasi, index) => {
    const foo = Object.entries(rekomendasi).filter(([key]) =>
      filteredKeys.includes(key)
    );
    const obj = Object.fromEntries(foo);
    const final = filteredKeys.map((val) => obj[val].toString());
    return [(index + 1).toString(), ...final, '-'];
  });

  const fonts = {
    Times: {
      normal: resolve('fonts', 'Times-Regular.ttf'),
      bold: resolve('fonts', 'Times-Bold.ttf'),
      italics: resolve('fonts', 'Times-Italic.ttf'),
    },
    Roboto: {
      normal: resolve('fonts', 'Roboto-Regular.ttf'),
      bold: resolve('fonts', 'Roboto-Bold.ttf'),
      italics: resolve('fonts', 'Roboto-Italic.ttf'),
    },
  };

  const docDefinition = {
    content: [
      {
        text: 'BRIGADE PERLINDUNGAN TANAMAN SABILULUNGAN (BRIPERTASA)',
        bold: true,
        lineHeight: 2,
        fontSize: 15,
        alignment: 'center',
      },
      {
        columns: [
          {
            stack: [
              {
                columns: [
                  { text: 'Nomor', width: 50 },
                  { text: ': ---/---/---', width: 150 },
                ],
              },
              {
                columns: [
                  { text: 'Sifat', width: 50 },
                  { text: ': Penting', width: 150 },
                ],
              },
              {
                columns: [
                  { text: 'Perihal', width: 50 },
                  { text: ': Permohonan Bantuan Pestisida', width: 150 },
                ],
              },
            ],
          },

          {
            text: 'Kepada Yth: Kepala Dinas Tanaman Pangan Dan Hortikultura Propinsi Jawa Barat Cq. BPTPH Provinsi Jawa Barat Di-Tempat',
            bold: true,
            width: 200,
          },
        ],
        margin: [0, 0, 0, 30],
      },

      {
        text: `Sehubungan dengan surat rekomendasi Pengendalian OPT pada tanggal ${new Date(data.rekomendasi_popt[0].tanggal_rekomendasi_pengendalian).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} dari POPT Kecamatan ${data.rekomendasi_popt[0].kecamatan} Pada tanaman Padi yang terserang oleh OPT di bawah ini:`,
        margin: [0, 0, 0, 20],
        lineHeight: 2,
      },
      {
        table: {
          headerRows: 1,
          body: [
            [
              { text: 'No', bold: true },
              { text: 'Jenis Tanaman / Varietas', bold: true },
              { text: 'Umur Tanaman (Hst)', bold: true },
              { text: 'Jenis OPT', bold: true },
              { text: 'Luas Serangan (HA)', bold: true },
              { text: 'Intensitas (%)', bold: true },
              { text: 'Kepadatan Populasi', bold: true },
            ],
            ...mappedRekomendasi,
          ],
        },
        margin: [20, 0, 20, 20],
      },
      {
        text: 'OPT Diatas telah melampau ambang pengendalian. Untuk itu kami mengajukan permohonan bantuan pestisida. (Jadwal pengendalian terlampir).',
        lineHeight: 2,
      },
      {
        text: 'Demikian disampaikan, atas perhatiannya kami ucapkan terimakasih.',
        margin: [20, 20, 0, 20],
      },
      {
        text: `${data.rekomendasi_popt[0].kecamatan}, ${new Date(data.tanggal_pengajuan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        alignment: 'right',
      },
      {
        text: `Ketua Brigade Kec. ${data.rekomendasi_popt[0].kecamatan}`,
        alignment: 'right',
        bold: true,
        margin: [0, 0, 0, 90],
      },
      {
        text: data.brigade.name,
        bold: true,
        decoration: 'underline',
        alignment: 'right',
        margin: [0, 0, 0, 100],
      },
      { text: 'Tembusan:' },
      { ul: ['Korsatpel Wilayah Bandung', 'Arsip'], margin: [20, 0, 0, 0] },
    ],
    styles: {},
    defaultStyle: {
      font: 'Times',
    },
  };

  const pdf = new PdfMake(fonts);
  const doc = pdf.createPdfKitDocument(docDefinition);
  doc.pipe(ws);
  doc.end();

  return fileUrlPath;
};
