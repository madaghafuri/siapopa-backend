import { db } from '.';
import { Lokasi } from './db/schema/lokasi';
import { SelectUser } from './db/schema/user';
import { SelectUserGroup } from './db/schema/user-group';

export function getValidKeyValuePairs<T extends Record<string, string | File>>(
  obj: T
) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([key, value]) => value !== null && value !== undefined && value !== ''
    )
  );
}

export function containsObject<T extends Object, K extends Array<T>>(
  obj: T,
  list: K
) {
  const found = list.find(
    (value) => JSON.stringify(value) === JSON.stringify(obj)
  );

  return !!found;
}

export async function getRelatedLocationsByUser(
  user: Partial<SelectUser> & { userGroup: SelectUserGroup }
) {
  let locations: Lokasi[] | null = null;
  switch (user.userGroup.group_name) {
    case 'bptph':
      locations = await db.query.lokasi.findMany({
        where: (lokasi, { eq }) => eq(lokasi.bptph_id, user.id),
      });
      return locations;

    case 'satpel':
      locations = await db.query.lokasi.findMany({
        where: (lokasi, { eq }) => eq(lokasi.satpel_id, user.id),
      });
      return locations;

    case 'kortikab':
      locations = await db.query.lokasi.findMany({
        where: (lokasi, { eq }) => eq(lokasi.kortikab_id, user.id),
      });
      return locations;

    case 'brigade':
      locations = await db.query.lokasi.findMany({
        where: (lokasi, { eq }) => eq(lokasi.brigade_id, user.id),
      });

    default:
      locations = await db.query.lokasi.findMany({
        where: (lokasi, { eq }) => eq(lokasi.pic_id, user.id),
      });
      return locations;
  }
}
