import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { SelectUser, user } from '../db/schema/user';
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
import { and, eq, sql } from 'drizzle-orm';
import { pengamatan } from '../db/schema/pengamatan';
import { opt } from '../db/schema/opt';

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
    ws.on('close', async () => {
      try {
        await db
          .update(rekomendasiPOPT)
          .set({
            surat_rekomendasi_popt:
              process.env.NODE_ENV === 'production'
                ? `https://sitampanparat.com/uploads/lampiran/` +
                  `lampiran_${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('')}_${insertRekomendasi[0].id}.pdf`
                : `http://localhost:3000/uploads/lampiran/` +
                  `lampiran_${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('')}_${insertRekomendasi[0].id}.pdf`,
          })
          .where(eq(rekomendasiPOPT.id, insertRekomendasi[0].id));
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
rekomendasiPOPTRoute.get('/:id', async (c) => {
  const rekomendasiId = c.req.param('id');

  const selectRekomendasi = await db.query.rekomendasiPOPT.findFirst({
    with: {
      popt: {
        columns: {
          password: false,
        },
      },
      opt: true,
      kecamatan: {
        columns: {
          point_kecamatan: false,
          area_kecamatan: false,
        },
      },
      kabupaten_kota: {
        columns: {
          point_kabkot: false,
          area_kabkot: false,
        },
      },
      bahan_aktif: true,
      pengamatan: {
        columns: {
          point_pengamatan: false,
        },
      },
      rincian_rekomendasi: true,
    },
    where: (rekomendasi, { eq }) => eq(rekomendasi.id, parseInt(rekomendasiId)),
  });

  return c.json({
    status: 200,
    message: 'success',
    data: selectRekomendasi,
  });
});
rekomendasiPOPTRoute.get('/', async (c) => {
  const { page, per_page, popt_id, lokasi_id } = c.req.query();

  const selectRekomendasi = await db
    .select({
      id: rekomendasiPOPT.id,
      varietas: rekomendasiPOPT.varietas,
      umur_tanaman: rekomendasiPOPT.umur_tanaman,
      jenis_pengendalian: rekomendasiPOPT.jenis_pengendalian,
      tanggal_rekomendasi_pengendalian:
        rekomendasiPOPT.tanggal_rekomendasi_pengendalian,
      ambang_lampau_pengendalian: rekomendasiPOPT.ambang_lampau_pengendalian,
      sign_popt: rekomendasiPOPT.sign_popt,
      surat_rekomendasi_popt: rekomendasiPOPT.surat_rekomendasi_popt,
      opt: opt,
      popt: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo: user.photo,
        validasi: user.validasi,
        usergroup_id: user.usergroup_id,
      },
      pengamatan: {
        id: pengamatan.id,
        lokasi_id: pengamatan.lokasi_id,
      },
    })
    .from(rekomendasiPOPT)
    .leftJoin(pengamatan, eq(pengamatan.id, rekomendasiPOPT.pengamatan_id))
    .leftJoin(opt, eq(opt.id, rekomendasiPOPT.opt_id))
    .leftJoin(user, eq(user.id, rekomendasiPOPT.popt_id))
    .where(
      and(
        !!popt_id ? eq(rekomendasiPOPT.popt_id, parseInt(popt_id)) : undefined,
        !!lokasi_id ? eq(pengamatan.lokasi_id, lokasi_id) : undefined
      )
    )
    .limit(parseInt(per_page || '10'))
    .offset((parseInt(page || '1') - 1) * parseInt(per_page || '10'));

  if (selectRekomendasi.length === 0) {
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
    data: selectRekomendasi,
  });
});
