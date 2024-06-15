import { customType } from "drizzle-orm/pg-core";

const customPolygon = customType({
  dataType(config) {
    return "geometry";
  },
});
