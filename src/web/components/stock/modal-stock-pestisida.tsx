import Modal, { ModalContent, ModalHeader } from '../modal.js';
import { SelectBahanAktif } from '../../../db/schema/bahan-aktif.js';
import { SelectGolonganPestisida } from '../../../db/schema/golongan-pestisida.js';
import { html } from 'hono/html';
import { SelectOPT } from '../../../db/schema/opt.js';
import { SelectTanaman } from '../../../db/schema/tanaman.js';
import { Provinsi } from '../../../db/schema/provinsi.js';
import { KabupatenKota } from '../../../db/schema/kabupaten-kota.js';
import { Kecamatan } from '../../../db/schema/kecamatan.js';
import { Desa } from '../../../db/schema/desa.js';
import { SelectPestisida } from '../../../db/schema/pestisida.js';

export const ModalStockPestisida = ({ 
  listGolongan, 
  listBahanAktif, 
  listOpt, 
  listTanaman, 
  listProvinsi,
  listKabKot,
  listKecamatan,
  listDesa,
  pestisida 
}: { 
  listTanaman?: SelectTanaman[], 
  listOpt?: SelectOPT[], 
  listGolongan?: SelectGolonganPestisida[], 
  listBahanAktif?: SelectBahanAktif[], 
  listProvinsi?: Provinsi[],
  listKabKot?: KabupatenKota[],
  listKecamatan?: Kecamatan[],
  listDesa?: Desa[],
  pestisida?: SelectPestisida 
}) => {
  const isEditing = !!pestisida;

  return (
    <Modal>
      <ModalHeader>
        <h2 class="text-xl font-bold">{isEditing ? 'Edit' : 'Create'} Pestisida</h2>
      </ModalHeader>
      <ModalContent>
        <form
          class="flex flex-col gap-3"
          hx-post={isEditing ? `/app/stock/stock-pestisida/edit/${pestisida?.id}` : "/app/stock/stock-pestisida"}
          hx-target="#error-message"
          hx-swap="innerHTML"
          hx-trigger="submit"
        >
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label>Golongan*</label>
              <select
                name="golongan_pestisida_id"
                required
                class="rounded border px-2 py-1 w-full"
              >
                <option value="">Select Golongan Pestisida</option>;
                {listGolongan.map((value) => {
                  return <option value={value.id}>{value.nama_golongan}</option>;
                })}
              </select>
            </div>
            <div>
              <label>Merk Dagang*</label>
              <input
                type="text"
                name="merk_dagang"
                defaultValue={pestisida?.merk_dagang || ''}
                value={pestisida?.merk_dagang || ''}
                required
                class="rounded border px-2 py-1 w-full"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label>Bahan Aktif*</label>
              <select
                id="bahan_aktif"
                name="bahan_aktif_id"
                value={pestisida?.bahan_aktif_id || ''}
                multiple
                required
                class="rounded border px-2 py-1 w-full"
              >
                {listBahanAktif.map((value) => {
                  return <option value={value.id}>{value.nama_bahan}</option>;
                })}
              </select>
            </div>
            <div>
              <label>Komoditas*</label>
              <select
                id='komoditas'
                name="tanaman_id"
                multiple
                required
                class="rounded border px-2 py-1 w-full"
              >
                {listTanaman.map((value) => {
                  return <option value={value.id}>{value.nama_tanaman}</option>;
                })}
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label>OPT Sasaran*</label>
              <select
                id='sasaran'
                name="opt_id"
                multiple
                required
                class="rounded border px-2 py-1 w-full"
              >
                <option value="">Select OPT Sasaran</option>;
                {listOpt.map((value) => {
                  return <option value={value.id}>{value.nama_opt}</option>;
                })}
              </select>
            </div>
            <div>
              <label>Satuan*</label>
              <select
                name="satuan"
                required
                class="rounded border px-2 py-1 w-full"
              >
                <option value="">Select Satuan</option>
                <option value="kg">Kg</option>
                <option value="liter">Liter</option>
                <option value="batang">Batang</option>
                {/* Add more options as needed */}
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
          <div>
              <label>Volume*</label>
              <input
                type="number"
                name="volume"
                defaultValue={pestisida?.volume || ''}
                value={pestisida?.volume || ''}
                required
                class="rounded border px-2 py-1 w-full"
              />
            </div>
            <div>
              <label>Expired Date</label>
              <input
                type="date"
                name="expired_date"
                required
                class="rounded border px-2 py-1 w-full"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
          <div>
              <label>Periode Bulan*</label>
              <input
                type="month"
                name="periode_bulan"
                defaultValue={pestisida?.periode_bulan || ''}
                value={pestisida?.periode_bulan || ''}
                required
                class="rounded border px-2 py-1 w-full"
              />
            </div>
            <div>
              <label>Tahun Pengadaan*</label>
              <input
                type="month"
                name="tahun_pengadaan"
                required
                class="rounded border px-2 py-1 w-full"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
          <div>
              <label>Provinsi*</label>
              <select
                name="provinsi"
                required
                class="rounded border px-2 py-1 w-full"
              >
                <option value="">Select Provinsi</option>;
                {listProvinsi.map((value) => {
                  return <option value={value.id}>{value.nama_provinsi}</option>;
                })}
              </select>
            </div>
            <div>
              <label>Kabupaten/Kota*</label>
              <select
                name="kabupaten_kota"
                required
                class="rounded border px-2 py-1 w-full"
              >
                <option value="">Select Kabupaten/Kota</option>;
                {listKabKot.map((value) => {
                  return <option value={value.id}>{value.nama_kabkot}</option>;
                })}
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
          <div>
              <label>Kecamatan*</label>
              <select
                name="kecamatan"
                required
                class="rounded border px-2 py-1 w-full"
              >
                <option value="">Select Kecamatan</option>;
                {listKecamatan.map((value) => {
                  return <option value={value.id}>{value.nama_kecamatan}</option>;
                })}
              </select>
            </div>
            <div>
              <label>Desa*</label>
              <select
                name="lokasi_id"
                required
                class="rounded border px-2 py-1 w-full"
              >
                <option value="">Select Desa</option>;
                {listDesa.map((value) => {
                  return <option value={value.id}>{value.nama_desa}</option>;
                })}
              </select>
            </div>
          </div>
          <div id="error-message"></div>
          <button
            class="rounded bg-primary px-2 py-1 text-white"
            hx-indicator="#loading"
            type="submit"
          >
            <div id="loading">
              <p>{isEditing ? 'Update' : 'Create'}</p>
              <i class="fa-solid fa-spinner"></i>
            </div>
          </button>
        </form>
        {html`
        <script>
          $(document).ready(function() {
              $('#bahan_aktif').select2();
              $('#komoditas').select2();
              $('#sasaran').select2();
          });
        </script>`}
      </ModalContent>
    </Modal>
  );
};
