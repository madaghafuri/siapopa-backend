import { SelectPengajuanPestisida } from '../../db/schema/pengajuan-pestisida';
import { SelectRekomendasiPOPT } from '../../db/schema/rekomendasi-popt';
import { resolve } from 'path';
import { Kecamatan } from '../../db/schema/kecamatan';
import { SelectOPT } from '../../db/schema/opt';
import { mkdirSync } from 'node:fs';
import { html, raw } from 'hono/html';
import { SelectUser } from '../../db/schema/user';

export const generateSuratPengajuanPestisida = async (
  data: SelectPengajuanPestisida & {
    rekomendasi_popt: (SelectRekomendasiPOPT & {
      kecamatan: Kecamatan;
      opt: SelectOPT;
      total_luas_serangan: number;
    })[];
    brigade: Omit<SelectUser, 'password'>;
  }
) => {
  // const browser = await puppeteer.launch({
  //   headless: true,
  //   args: ['--no-sandbox', '--disable-setuid-sandbox'],
  // });
  // const page = await browser.newPage();
  // const SuratPengajuan = () => html`
  //   <html lang="id">
  //     <head>
  //       <meta charset="UTF-8" />
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  //       <title>BRIGADE PERLINDUNGAN TANAMAN SABILULUNGAN</title>
  //       <style>
  //         body {
  //           font-family: Arial, sans-serif;
  //           line-height: 1.6;
  //           padding: 20px;
  //           max-width: 800px;
  //           margin: 0 20px 0 20px;
  //         }
  //         h2 {
  //           text-align: center;
  //           margin-bottom: 5px;
  //         }
  //         p {
  //           margin: 10px 0;
  //         }
  //         table {
  //           width: 100%;
  //           border-collapse: collapse;
  //           margin-bottom: 20px;
  //         }
  //         th,
  //         td {
  //           border: 1px solid black;
  //           padding: 5px;
  //           text-align: left;
  //         }
  //         .header-table {
  //           border: none;
  //         }
  //         .header-table td {
  //           border: none;
  //           vertical-align: top;
  //         }
  //         .right-align {
  //           text-align: right;
  //         }
  //         .center {
  //           text-align: center;
  //         }
  //         .signature {
  //           object-fit: contain;
  //         }
  //       </style>
  //     </head>
  //     <body>
  //       <h2>BRIGADE PERLINDUNGAN TANAMAN SABILULUNGAN<br />(BRIPERTASA)</h2>
  //       <p class="center">
  //         Desa Nagrak Kec. ${data.rekomendasi_popt[0].kecamatan.nama_kecamatan}
  //         Kab. Bandung
  //       </p>
  //       <table class="header-table">
  //         <tr>
  //           <td>Nomor</td>
  //           <td>: 008/BTS/03</td>
  //           <td rowspan="3" class="right-align">
  //             Kepada Yth :<br />
  //             Kepala Dinas Tanaman Pangan Dan<br />
  //             Hortikultura Propinsi Jawa Barat<br />
  //             Cq. BPTPH Propinsi Jawa Barat<br />
  //             Di Tempat
  //           </td>
  //         </tr>
  //         <tr>
  //           <td>Sifat</td>
  //           <td>: Penting</td>
  //         </tr>
  //         <tr>
  //           <td>Perihal</td>
  //           <td>: Permohonan Bantuan Pestisida</td>
  //         </tr>
  //       </table>
  //       <p>
  //         Sehubungan dengan surat rekomendasi Pengendalian OPT
  //         ${new Date(
  //           data.rekomendasi_popt[0].tanggal_rekomendasi_pengendalian
  //         ).toLocaleDateString('id-ID', {
  //           weekday: 'long',
  //           day: 'numeric',
  //           month: 'long',
  //           year: 'numeric',
  //         })}
  //         Dari POPT Kecamatan ${data.rekomendasi_popt[0].kecamatan} Pada Tanaman
  //         Padi yang tersesang oleh OPT di bawah ini :
  //       </p>
  //       <table>
  //         <tr>
  //           <th>No</th>
  //           <th>Jenis Tanaman / Varietas</th>
  //           <th>Umur Tanaman (Hst)</th>
  //           <th>Jenis OPT</th>
  //           <th>Luas Serangan (HA)</th>
  //           <th>Intensitas (%)</th>
  //           <th>Kepadatan Populasi</th>
  //         </tr>
  //         ${data.rekomendasi_popt.map((val, index) =>
  //           raw(`<tr>
  //               <td>${index + 1}</td>
  //               <td>${val.varietas}</td>
  //               <td>${val.umur_tanaman}</td>
  //               <td>${val.opt}</td>
  //               <td>${val.total_luas_serangan}</td>
  //               <td>${val.ambang_lampau_pengendalian}</td>
  //               <td>-</td>
  //           </tr>`)
  //         )}
  //       </table>
  //       <p>
  //         OPT Diatas telah melampaui ambang pengendalian. Untuk Itu kami
  //         mengajukan permohonan bantuan pestisida. ( Jadwal pengendalian
  //         terlampir ).
  //       </p>
  //       <p>Demikian disampaikan, atas perhatiannya kami ucapkan terimakasih</p>
  //       <p class="right-align">
  //         ${data.rekomendasi_popt[0].kecamatan.nama_kecamatan}
  //         ${new Date().toLocaleDateString('id-ID', {
  //           day: 'numeric',
  //           month: 'long',
  //           year: 'numeric',
  //         })}<br />
  //         Ketua Brigade Kecamatan ${data.rekomendasi_popt[0].kecamatan}<br /><br />
  //         <br></br>
  //         <br></br>
  //         <br></br>
  //         <br></br>
  //         ${data.brigade.name}
  //       </p>
  //       <p>
  //         Tembusan :<br />
  //         - Korsatpel Wilayah IV Bandung ( Sebagai Laporan )<br />
  //         - Arsip
  //       </p>
  //     </body>
  //   </html>
  // `;
  // await page.setContent(SuratPengajuan() as string);
  // const path = resolve('uploads', 'lampiran', 'pengajuan');
  // const fileName = `surat_${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('')}_${data.id}.pdf`;
  // if (!(await Bun.file(path).exists())) {
  //   mkdirSync(path, { recursive: true });
  // }
  // await page.pdf({
  //   path: resolve(path, fileName),
  //   format: 'A4',
  //   printBackground: true,
  // });
  // await browser.close();
  // const imageURL =
  //   // Bun.env.NODE_ENV === 'production'
  //   // ? `https://sitampanparat.com` + `/uploads/lampiran/pengajuan/${fileName}`
  //   `http://localhost:3000/uploads/lampiran/pengajuan/${fileName}`;
  // return imageURL;
};
