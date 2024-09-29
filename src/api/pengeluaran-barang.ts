import { Hono } from 'hono';
import { validator } from 'hono/validator';
import {
  barang,
  InsertBarang,
  InsertPengeluaranBarang,
  pengeluaranBarang,
} from '../db/schema/pengeluaran-barang';
import { db } from '..';
import { resolve } from 'path';
import { mkdir } from 'node:fs/promises';
import PdfMake from 'pdfmake';
import { createWriteStream } from 'node:fs';
import { eq } from 'drizzle-orm';

export const pengeluaranRoute = new Hono().basePath('pengeluaran');
pengeluaranRoute.post(
  '/',
  validator('json', (value, c) => {
    const { rincian_barang, bptph_id, ...rest } =
      value as InsertPengeluaranBarang & {
        rincian_barang: InsertBarang[];
      };

    if (!rincian_barang || rincian_barang.length === 0 || !bptph_id) {
      return c.json(
        {
          status: 401,
          message: 'missing required data',
        },
        401
      );
    }

    return { ...rest, rincian_barang, bptph_id };
  }),
  async (c) => {
    const { rincian_barang, ...data } = c.req.valid('json');

    try {
      var insertData = await db
        .insert(pengeluaranBarang)
        .values({ ...data })
        .returning();
    } catch (error) {
      console.error(error);
      return c.json(
        {
          status: 500,
          message: error,
        },
        500
      );
    }

    const validRincianBarang = rincian_barang.map((val) => ({
      ...val,
      pengeluaran_id: insertData[0].id,
    }));

    try {
      await db.insert(barang).values(validRincianBarang);
    } catch (error) {
      console.error(error);
      return c.json(
        {
          status: 500,
          message: error,
        },
        500
      );
    }

    const selectData = await db.query.pengeluaranBarang.findFirst({
      with: {
        pengajuan_pestisida: {
          with: {
            brigade: true,
          },
        },
        barang: {
          with: {
            pestisida: {
              columns: {
                merk_dagang: true,
              },
            },
          },
        },
        bptph: {
          columns: {
            password: false,
          },
        },
      },
      where: (pengeluaran, { eq }) => eq(pengeluaran.id, insertData[0].id),
    });

    const filteredKeys = [
      'id',
      'pengeluaran_id',
      'jenis_barang',
      'pestisida_id',
      'aph_id',
      'created_at',
    ];

    const mappedBarang = selectData.barang.map((val, index) => {
      const foo = Object.entries(val)
        .filter(([key]) => !filteredKeys.includes(key))
        .map(([key, value]) => {
          if (key === 'pestisida') return value['merk_dagang'];

          return value;
        });
      return [(index + 1).toString(), ...foo];
    });

    const uploadPath = resolve('uploads', 'pengeluaran', 'pestisida');
    const [day, month, year] = new Date()
      .toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
      .split('/');
    const fileName = `SPPB_${year}${month}${day}_${insertData[0].id}.pdf`;

    if (!(await Bun.file(uploadPath).exists())) {
      await mkdir(uploadPath, { recursive: true });
    }
    const ws = createWriteStream(resolve(uploadPath, fileName));
    const urlPath =
      process.env.NODE_ENV === 'production'
        ? 'https://sitampanparat.com'
        : 'http://localhost:3000';
    ws.on('finish', async () => {
      try {
        await db
          .update(pengeluaranBarang)
          .set({
            surat_pengeluaran: `${urlPath}/uploads/pengeluaran/pestisida/${fileName}`,
          })
          .where(eq(pengeluaranBarang.id, insertData[0].id));
      } catch (error) {
        console.error(error);
        return c.json(
          {
            status: 500,
            message: error,
          },
          500
        );
      }
    });

    const docDefinition = {
      content: [
        { text: 'SURAT PERINTAH PENGELUARAN BARANG', style: 'header' },
        {
          text: `Menindak lanjuti surat dari POKTAN, maka diperintahkan kepada Brigade ${selectData.pengajuan_pestisida.brigade.name} untuk mengeluarkan Pestisida sebagai bantuan pada gerakan pengendalian OPT PBP pada tanaman Padi serta berpartisipasi aktif pada kegiatan tersebut`,
          style: 'paragraph',
        },
        {
          text: 'Barang-barang yang dikeluarkan untuk mendukung kegiatan gerakan pengedalian OPT tersebut, adalah sebagai berikut:',
          style: 'paragraph',
        },
        {
          table: {
            headerRows: 1,
            body: [
              [
                { text: 'No', bold: true },
                { text: 'Merk Barang', bold: true },
                { text: 'Satuan', bold: true },
                { text: 'Angka', bold: true },
                { text: 'Keterangan', bold: true },
              ],
              ...mappedBarang,
            ],
          },
          margin: [20, 20, 0, 20],
        },
        { text: 'Catatan:', style: 'paragraph' },
        {
          ul: [
            'Setiap pengeluaran barang harus dibuat berita acara serah terima oleh BPT.',
            'Setiap penerimaan barang agar dibuat laporan hasil pengendalian.',
            'Apabila barang tidak diambil dalam waktu 7 hari terhitung sejak terbitnysa SPPB ini dianggap batal.',
          ],
          style: 'catatan',
        },
        {
          text: `Bandung, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          alignment: 'right',
          margin: [0, 0, 0, 20],
        },
        {
          text: 'KEPALA BALAI PERLINDUNGAN TANAMAN PANGAN DAN HORTIKULTURA PROVINSI JAWA BARAT',
          alignment: 'right',
          margin: [0, 0, 0, 90],
          width: 100,
        },
        {
          text: selectData.bptph.name,
          decoration: 'underline',
          alignment: 'right',
        },
      ],
      styles: {
        header: {
          fontSize: 16,
          alignment: 'center',
          margin: [0, 150, 0, 20],
          bold: true,
          decoration: 'underline',
        },
        paragraph: {
          fontSize: 12,
          alignment: 'justify',
          margin: [0, 10],
        },
        catatan: {
          margin: [20, 10, 0, 50],
        },
      },
      defaultStyle: {
        font: 'Times',
      },
    };

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
    const pdf = new PdfMake(fonts);
    const doc = pdf.createPdfKitDocument(docDefinition);
    doc.pipe(ws);
    doc.end();

    return c.json({
      status: 200,
      message: 'success',
    });
  }
);

pengeluaranRoute.get('/', async (c) => {
  const { per_page, page } = c.req.query();

  const dataPengeluaranBarang = await db.query.pengeluaranBarang.findMany({
    with: {
      barang: true,
      pengajuan_pestisida: {
        with: {
          rekomendasi_popt: true,
        }
      }
    },
    limit: parseInt(per_page || '10'),
    offset: (parseInt(page || '1') - 1) * parseInt(per_page || '10')
  })

  if (dataPengeluaranBarang.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'data not found',
      },
      404
    );
  }

  return c.json({
    status: 200,
    message: 'success',
    data: dataPengeluaranBarang,
  });
});
