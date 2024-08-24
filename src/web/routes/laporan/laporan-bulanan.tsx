import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import { SelectUser, user } from '../../../db/schema/user';
import { SelectUserGroup } from '../../../db/schema/user-group';
import { lokasi, Lokasi } from '../../../db/schema/lokasi';
import { db } from '../../..';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { DefaultLayout } from '../../layouts/default-layout';
import Profile from '../../components/profile';
import { LaporanBulananPage } from '../../pages/laporan/laporan-bulanan';
import { laporanBulanan } from '../../../db/schema/laporan-bulanan';
import { getRelatedLocationsByUser } from '../../../helper';
import { laporanSb } from '../../../db/schema/laporan-sb';

export const laporanBulananRoute = new Hono<{
  Variables: {
    session: Session;
    user: Omit<SelectUser, 'password'> & {
      userGroup: SelectUserGroup;
      locations: Lokasi[];
    };
  };
}>().basePath('bulanan');
laporanBulananRoute.get('/', async (c) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;
  const { page, per_page, start_date, end_date } = c.req.query();

  const selectedUser = c.get('user');
  const assignedLocations = await getRelatedLocationsByUser(selectedUser);

  const validLaporan = await db
    .select()
    .from(laporanBulanan)
    .where(
      and(
        !!start_date
          ? gte(laporanBulanan.tanggal_laporan_bulanan, start_date)
          : undefined,
        !!end_date
          ? lte(laporanBulanan.tanggal_laporan_bulanan, end_date)
          : undefined
      )
    )
    .limit(parseInt(per_page || '10'))
    .offset((parseInt(page || '1') - 1) * parseInt(per_page || '10'));

  const dataLaporanBulanan =
    validLaporan.length > 0
      ? await db
          .select()
          .from(laporanBulanan)
          .leftJoin(
            laporanSb,
            eq(laporanSb.laporan_bulanan_id, laporanBulanan.id)
          )
          .where(
            and(
              selectedUser.userGroup.group_name !== 'bptph'
                ? inArray(
                    lokasi.id,
                    assignedLocations.map((val) => val.id)
                  )
                : undefined,
              inArray(
                laporanBulanan.id,
                validLaporan.map((val) => val.id)
              )
            )
          )
      : [];

  return c.html(
    <DefaultLayout
      route="laporan-bulanan"
      authNavigation={!!selectedUser ? <Profile user={selectedUser} /> : null}
      user={selectedUser || null}
    >
      <LaporanBulananPage laporanBulananData={dataLaporanBulanan} />
    </DefaultLayout>
  );
});
