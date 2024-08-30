import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { SelectUser } from '../db/schema/user';
import { SelectUserGroup } from '../db/schema/user-group';
import { Lokasi } from '../db/schema/lokasi';
import { validator } from 'hono/validator';
import {
  InsertRekomendasiPOPT,
  rekomendasiPOPT,
} from '../db/schema/rekomendasi-popt';
import {
  InsertRincianRekomendasiPOPT,
  rincianRekomendasiPOPT,
} from '../db/schema/rincian-rekomendasi-popt';
import { db } from '..';
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';
import { resolve } from 'path';
import { eq, sql } from 'drizzle-orm';

export const rekomendasiPOPTRoute = new Hono<{
  Variables: {
    session: Session;
    user: Omit<SelectUser, 'password'> & {
      userGroup: SelectUserGroup;
      locations: Lokasi[];
    };
  };
}>().basePath('/rekomendasi-popt');

rekomendasiPOPTRoute.post(
  '/',
  validator('json', (value, c) => {
    const { opt_id, popt_id, pengamatan_id, rincian_rekomendasi } =
      value as InsertRekomendasiPOPT & {
        rincian_rekomendasi: InsertRincianRekomendasiPOPT[];
      };
    if (
      !opt_id ||
      !popt_id ||
      !pengamatan_id ||
      !rincian_rekomendasi ||
      rincian_rekomendasi.length === 0
    ) {
      return c.json(
        {
          status: 401,
          message: 'missing required data',
        },
        401
      );
    }

    return value as InsertRekomendasiPOPT & {
      rincian_rekomendasi: InsertRincianRekomendasiPOPT[];
    };
  }),
  async (c) => {
    const { rincian_rekomendasi, ...data } = c.req.valid('json');

    try {
      var insertRekomendasi = await db
        .insert(rekomendasiPOPT)
        .values({ ...data })
        .returning();
    } catch (error) {
      console.error(error);
      return c.json(
        {
          status: 500,
          message: 'internal server error ' + error,
        },
        500
      );
    }

    const mappedRincian = rincian_rekomendasi.map((val) => ({
      ...val,
      rekomendasi_popt_id: insertRekomendasi[0].id,
    }));

    try {
      await db.insert(rincianRekomendasiPOPT).values(mappedRincian);
    } catch (error) {
      console.error(error);
      return c.json(
        {
          status: 500,
          message: 'internal server error ' + error,
        },
        500
      );
    }

    const selectLuasKerusakan = await db
      .select({
        rekomendasi_popt_id: rincianRekomendasiPOPT.rekomendasi_popt_id,
        total_luas_kerusakan: sql`sum(${rincianRekomendasiPOPT.luas_serangan})`,
      })
      .from(rincianRekomendasiPOPT)
      .where(
        eq(rincianRekomendasiPOPT.rekomendasi_popt_id, insertRekomendasi[0].id)
      )
      .groupBy(rincianRekomendasiPOPT.rekomendasi_popt_id);

    const selectRekomendasiData = await db.query.rekomendasiPOPT.findFirst({
      with: {
        pengamatan: {
          columns: {
            tanggal_pengamatan: true,
          },
        },
        kecamatan: true,
        kabupaten_kota: {
          columns: {
            point_kabkot: false,
            area_kabkot: false,
          },
        },
        bahan_aktif: true,
        opt: true,
        popt: true,
        rincian_rekomendasi: {
          with: {
            desa: true,
          },
        },
      },
      where: (rekomendasi, { eq }) =>
        eq(rekomendasi.id, insertRekomendasi[0].id),
    });

    const signUrl = new URL(selectRekomendasiData.sign_popt);
    const validUrl = signUrl.pathname.split('/');
    const doc = new PDFDocument();
    const path = resolve('uploads', 'lampiran');
    const ws = createWriteStream(
      resolve(
        path,
        `lampiran_${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('')}_${selectRekomendasiData.id}.pdf`
      )
    );
    ws.on('finish', async () => {
      try {
        await db
          .update(rekomendasiPOPT)
          .set({
            surat_rekomendasi_popt:
              process.env.NODE_ENV === 'production'
                ? `https://sitampanparat.com/` +
                  resolve(
                    path,
                    `lampiran_${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('')}_${selectRekomendasiData.id}.pdf`
                  )
                : `http://localhost:3000/` +
                  resolve(
                    path,
                    `lampiran_${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('')}_${selectRekomendasiData.id}.pdf`
                  ),
          })
          .where(eq(rekomendasiPOPT.id, selectRekomendasiData.id));
      } catch (error) {
        console.error(error);
        return c.json(
          {
            status: 500,
            message: 'error when setting lampirat path',
          },
          500
        );
      }
    });
    doc.pipe(ws);

    doc.fontSize(14).text('BPTPH JAWA BARAT');
    doc.moveDown();

    doc
      .fontSize(12)
      .text(`Kecamatan   : ${selectRekomendasiData.kecamatan.nama_kecamatan}`)
      .text(
        `Tanggal: ${new Date(selectRekomendasiData.tanggal_rekomendasi_pengendalian).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        { align: 'right' }
      );
    doc.moveDown();

    doc.fontSize(14).text('SURAT REKOMENDASI PENGENDALIAN OPT', {
      underline: true,
      align: 'center',
    });
    doc.fontSize(12).text(`Jenis OPT: ${selectRekomendasiData.opt.nama_opt}`, {
      align: 'center',
    });

    doc.moveDown();

    doc
      .fontSize(12)
      .text('Kepada Yth:')
      .list([
        'KCD/P3K',
        'Kepala BPP/Koordinator PPL',
        'PPL Setempat',
        'Kepala Desa Setempat',
      ]);
    doc.moveDown();

    doc
      .fontSize(12)
      .text(
        `Berdasarkan pengamatan yang dilakukan tanggal ${new Date(selectRekomendasiData.pengamatan.tanggal_pengamatan).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} pada tanaman Varietas ${selectRekomendasiData.varietas} umur tanaman ${selectRekomendasiData.umur_tanaman} Lokasi Wilayah Kelompok / Desa :`,
        { align: 'justify' }
      );
    doc.moveDown();

    doc.list(
      selectRekomendasiData.rincian_rekomendasi.map(
        (val) => `Desa ${val.desa.nama_desa}  Seluas ${val.luas_serangan} Ha`
      )
    );
    doc.moveDown();

    doc
      .fontSize(12)
      .text(
        `Jumlah seluas ${selectLuasKerusakan[0].total_luas_kerusakan} Ha Kecamatan ${selectRekomendasiData.kecamatan.nama_kecamatan} Kabupaten ${selectRekomendasiData.kabupaten_kota.nama_kabkot} menunjukkan bahwa ${selectRekomendasiData.jenis_pengendalian} OPT ${selectRekomendasiData.opt.nama_opt} telah melampau ambang pengedalian (${selectRekomendasiData.ambang_lampau_pengendalian} %).`,
        { align: 'justify' }
      );
    doc
      .fontSize(12)
      .text(
        'Apabila tidak dilakukan tindakan pengendalian serangan OPT tersebut dikhawatirkan akan lebih luas dan atau lebih parah. Untuk itu perlu segera dilakukan langkah-langkah berikut:',
        { align: 'justify' }
      );
    doc
      .fontSize(12)
      .list([
        `Segera melakukan gerakan pengendalian dengan bahan aktif ${selectRekomendasiData.bahan_aktif.nama_bahan} secara serentak.`,
      ]);
    doc.moveDown();

    doc
      .fontSize(12)
      .text(
        `${selectRekomendasiData.rincian_rekomendasi[0].desa.nama_desa}, ${new Date(selectRekomendasiData.tanggal_rekomendasi_pengendalian).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        { align: 'right' }
      )
      .text('Pengendali OPT', { align: 'right' });

    doc.image(`uploads/signature/${validUrl[3]}`, 450, 510, {
      width: 100,
      height: 100,
      fit: [100, 100],
      align: 'right',
      link: signUrl.toString(),
    });
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    doc.fontSize(12).text(`${selectRekomendasiData.popt.name}`, {
      underline: true,
      align: 'right',
    });
    doc.moveDown();

    doc
      .fontSize(10)
      .text('Tembusan:')
      .list([
        `Dinas Pertanian ${selectRekomendasiData.kabupaten_kota.nama_kabkot}`,
        `SATPEL ${selectRekomendasiData.kabupaten_kota.nama_kabkot}`,
        `Brigade Perlindungan ${selectRekomendasiData.kabupaten_kota.nama_kabkot}`,
      ]);

    doc.end();

    return c.json({
      status: 200,
      message: 'success',
    });
  }
);
