//@ts-nocheck
import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { SelectUser, user } from '../../db/schema/user';
import { SelectUserGroup } from '../../db/schema/user-group';
import { lokasi, Lokasi } from '../../db/schema/lokasi';
import { DefaultLayout } from '../layouts/default-layout';
import Profile from '../components/profile';
import { RekomendasiPopt } from '../pages/rekomendasi/popt';
import { getRelatedLocationsByUser } from '../../helper';
import { db } from '../..';
import { rekomendasiPOPT } from '../../db/schema/rekomendasi-popt';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { kecamatan } from '../../db/schema/kecamatan';
import { opt } from '../../db/schema/opt';
import { bahanAktif } from '../../db/schema/bahan-aktif';
import { rincianRekomendasiPOPT } from '../../db/schema/rincian-rekomendasi-popt';

export const rekomendasiRoute = new Hono<{
  Variables: {
    session: Session;
    user: Omit<SelectUser, 'password'> & {
      userGroup: SelectUserGroup;
      locations: Lokasi[];
    };
  };
}>().basePath('/popt');
rekomendasiRoute.get('/', async (c) => {
  const { start_date, end_date, page, per_page } = c.req.query();
  const selectUser = c.get('user');
  const assignedLocations = await getRelatedLocationsByUser(selectUser);

  const rincianLokasi = await db
    .select({
      id: rincianRekomendasiPOPT.id,
      rekomendasi_popt_id: rincianRekomendasiPOPT.rekomendasi_popt_id,
    })
    .from(rincianRekomendasiPOPT)
    .leftJoin(lokasi, eq(lokasi.id, rincianRekomendasiPOPT.lokasi_id))
    .where(
      and(
        selectUser.userGroup.group_name === 'brigade'
          ? inArray(
              lokasi.id,
              assignedLocations.map((val) => val.id)
            )
          : undefined
      )
    );

  const dataRekomendasi = await db
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
      kecamatan: {
        id: kecamatan.id,
        nama_kecamatan: kecamatan.nama_kecamatan,
      },
      opt: opt,
      popt: user,
      bahan_aktif: bahanAktif,
      kecamatan_id: rekomendasiPOPT.kecamatan_id,
      kabkot_id: rekomendasiPOPT.kabkot_id,
      opt_id: rekomendasiPOPT.opt_id,
      popt_id: rekomendasiPOPT.popt_id,
      bahan_aktif_id: rekomendasiPOPT.bahan_aktif_id,
      pengamatan_id: rekomendasiPOPT.pengamatan_id,
      created_at: rekomendasiPOPT.created_at,
    })
    .from(rekomendasiPOPT)
    .leftJoin(kecamatan, eq(kecamatan.id, rekomendasiPOPT.kecamatan_id))
    .leftJoin(user, eq(user.id, rekomendasiPOPT.popt_id))
    .leftJoin(opt, eq(opt.id, rekomendasiPOPT.opt_id))
    .leftJoin(bahanAktif, eq(bahanAktif.id, rekomendasiPOPT.bahan_aktif_id))
    .where(
      and(
        selectUser.userGroup.group_name === 'bptph'
          ? undefined
          : inArray(
              rekomendasiPOPT.id,
              rincianLokasi.map((val) => val.rekomendasi_popt_id)
            )
      )
    )
    .orderBy(desc(rekomendasiPOPT.created_at));

  return c.html(
    <DefaultLayout
      route="rekomendasi"
      authNavigation={!!selectUser ? <Profile user={selectUser} /> : null}
      user={selectUser}
    >
      <RekomendasiPopt rekomendasiData={dataRekomendasi} />
    </DefaultLayout>
  );
});
