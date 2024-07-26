import { customType } from 'drizzle-orm/pg-core';
import { GeoJSON } from 'geojson';

export const geom = <TData extends GeoJSON.Geometry>(name: string) =>
  customType<{ data: TData; driverData: string }>({
    dataType() {
      return 'geometry';
    },
    toDriver(value: TData) {
      return JSON.stringify(value);
    },
    fromDriver(value) {
      return JSON.parse(value as string) as TData;
    },
  })(name);
