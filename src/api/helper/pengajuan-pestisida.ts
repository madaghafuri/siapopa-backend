import puppeteer from 'puppeteer';
import { SelectPengajuanPestisida } from '../../db/schema/pengajuan-pestisida';
import { SelectRekomendasiPOPT } from '../../db/schema/rekomendasi-popt';
import { resolve } from 'path';
import { Kecamatan } from '../../db/schema/kecamatan';
import { SelectOPT } from '../../db/schema/opt';
import { mkdirSync } from 'node:fs';

export const generateSuratPengajuanPestisida = async (
  data: SelectPengajuanPestisida & {
    rekomendasi_popt: (SelectRekomendasiPOPT & {
      kecamatan: Kecamatan;
      opt: SelectOPT;
      total_luas_serangan: number;
    })[];
  }
) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setContent(`
    <html lang="id">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>BRIGADE PERLINDUNGAN TANAMAN SABILULUNGAN</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  margin: 0;
                  padding: 20px;
                  max-width: 800px;
                  margin: 0 auto;
              }
              h2 {
                  text-align: center;
                  margin-bottom: 5px;
              }
              p {
                  margin: 10px 0;
              }
              table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
              }
              th, td {
                  border: 1px solid black;
                  padding: 5px;
                  text-align: left;
              }
              .header-table {
                  border: none;
              }
              .header-table td {
                  border: none;
                  vertical-align: top;
              }
              .right-align {
                  text-align: right;
              }
              .center {
                  text-align: center;
              }
              .stamp {
                  width: 100px;
                  height: 100px;
                  border: 2px solid purple;
                  border-radius: 50%;
                  display: inline-block;
                  position: relative;
                  margin-left: 50px;
              }
              .stamp::after {
                  content: "BRIPERTASA";
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  color: purple;
                  font-weight: bold;
              }
          </style>
      </head>
      <body>
          <h2>BRIGADE PERLINDUNGAN TANAMAN SABILULUNGAN<br>(BRIPERTASA)</h2>

          <p class="center">Alamat Kmp Panyaungan Rt/Rw 001/001 Desa Nagrak Kec. Soreang Kab. Bandung</p>

          <table class="header-table">
              <tr>
                  <td>Nomor</td>
                  <td>: 008/BTS/03</td>
                  <td rowspan="3" class="right-align">
                      Kepada Yth :<br>
                      Kepala Dinas Tanaman Pangan Dan<br>
                      Hortikultura Propinsi Jawa Barat<br>
                      Cq. BPTPH Propinsi Jawa Barat<br>
                      Di -<br>
                      Tempat
                  </td>
              </tr>
              <tr>
                  <td>Sifat</td>
                  <td>: Penting</td>
              </tr>
              <tr>
                  <td>Perihal</td>
                  <td>: Permohonan Bantuan Pestisida</td>
              </tr>
          </table>

          <p>Sehubungan dengan surat rekomendasi Pengendalian OPT tanggal 01 Setember 2022 Dari POPT Kecamatan Soreang Pada Tanaman Padi yang tersesang oleh OPT di bawah ini :</p>

          <table>
              <tr>
                  <th>No</th>
                  <th>Jenis Tanaman / Varietas</th>
                  <th>Umur Tanaman (Hst)</th>
                  <th>Jenis OPT</th>
                  <th>Luas Serangan (HA)</th>
                  <th>Intensitas (%)</th>
                  <th>Kepadatan Populasi</th>
              </tr>
              <tr>
                  <td>1</td>
                  <td>Padi</td>
                  <td>32-60</td>
                  <td>Penggerek Batang</td>
                  <td>102</td>
                  <td>14,05</td>
                  <td>-</td>
              </tr>
              <tr>
                  <td>2</td>
                  <td>Padi</td>
                  <td>70-85</td>
                  <td>Tikus</td>
                  <td>60</td>
                  <td>11,35</td>
                  <td></td>
              </tr>
          </table>

          <p>OPT Diatas telah melampaui ambang pengendalian. Untuk Itu kami mengajukan permohonan bantuan pestisida. ( Jadwal pengendalian terlampir ).</p>

          <p>Demikian disampaikan, atas perhatiannya kami ucapkan terimakasih</p>

          <p class="right-align">
              Soreang, ...................<br>
              Ketua BTS Kecamatan Soreang<br><br>
              <span class="stamp"></span><br><br>
              Undang Rohimat
          </p>

          <p>
              Tembusan :<br>
              - Korsatpel Wilayah IV Bandung ( Sebagai Laporan )<br>
              - Arsip
          </p>
      </body>
</html>
    `);

  const path = resolve('uploads', 'lampiran', 'pengajuan');
  const fileName = `surat_${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('')}_${data.id}.pdf`;
  if (!(await Bun.file(path).exists())) {
    mkdirSync(path, { recursive: true });
  }
  await page.pdf({
    path: resolve(path, fileName),
    format: 'A4',
    printBackground: true,
  });
  await browser.close();
  const imageURL =
    // Bun.env.NODE_ENV === 'production'
    // ? `https://sitampanparat.com` + `/uploads/lampiran/pengajuan/${fileName}`
    `http://localhost:3000/uploads/lampiran/pengajuan/${fileName}`;

  return imageURL;
};
