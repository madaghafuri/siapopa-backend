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

export const pengeluaranRoute = new Hono().basePath('pengeluaran');
pengeluaranRoute.post(
  '/',
  validator('json', (value, c) => {
    return value as InsertPengeluaranBarang & {
      rincian_barang: InsertBarang[];
    };
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
      await db.insert(pengeluaranBarang).values(validRincianBarang);
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
        barang: true,
      },
      where: (pengeluaran, { eq }) => eq(pengeluaran.id, insertData[0].id),
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

    const docDefinition = {
      content: [
        { text: 'SURAT PERINTAH PENGELUARAN BARANG', style: 'header' },
        {
          text: 'Menindak lanjuti surat dari POKTAN, maka diperintahkan kepada Brigade untuk mengeluarkan Pestisida sebagai bantuan pada gerakan pengendalian OPT PBP pada tanaman Padi serta berpartisipasi aktif pada kegiatan tersebut',
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
                { text: 'Huruf', bold: true },
                { text: 'Keterangan', bold: true },
              ],
              ['1', 'Panadol', 'Kg', '20', 'Dua Puluh', 'Lorem ipsum dolor'],
            ],
          },
        },
      ],
      styles: {
        header: {
          fontSize: 16,
          alignment: 'center',
          margin: [0, 100, 0, 20],
          bold: true,
        },
        paragraph: {
          fontSize: 12,
          alignment: 'justify',
          margin: [0, 10],
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

    console.log(fileName);

    return c.json({
      status: 200,
      message: 'success',
    });
  }
);

pengeluaranRoute.get('/', async (c) => {
  const { per_page, page } = c.req.query();
  const selectData = await db
    .select()
    .from(pengeluaranBarang)
    .limit(parseInt(per_page || '10'))
    .offset((parseInt(page || '1') - 1) * parseInt(per_page || '10'));

  if (selectData.length === 0) {
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
    data: selectData,
  });
});
