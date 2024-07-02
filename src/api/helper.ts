import { SQL, sql } from "drizzle-orm";
import { PgSelect } from "drizzle-orm/pg-core";
import { Kerusakan } from "../db/schema/detail-rumpun";

export function withQueries<T extends PgSelect>(
  qb: T,
  queries: [string, string][],
  filter: "=" | "<" | ">" | "<=" | ">=" | "<>"
) {
  const sqlChunks: SQL[] = [];
  if (queries.length > 0) {
    queries.forEach(([key, value], index, arr) => {
      sqlChunks.push(sql`${key} ${filter} ${value}`);
      if (index === arr.length - 1) return;
      sqlChunks.push(sql`and`);
    });

    return qb.where(sql.join(sqlChunks, sql.raw(" ")));
  }

  return qb;
}

export function withQuery<T extends PgSelect>(
  qb: T,
  query: [string, string],
  filter: "=" | "<" | ">" | "<=" | ">=" | "<>"
) {
  const [key, value] = query;
  return qb.where(sql`${key} ${filter} ${value}`);
}

export function withPagination<T extends PgSelect>(
  qb: T,
  page: number = 1,
  pageSize: number = 10
) {
  return qb.limit(pageSize).offset((page - 1) * pageSize);
}

export function hasilPengamatan(kategori: Kerusakan, jumlahOpt: number, jumlahAnakan: number) {
  switch (kategori) {
    case "mutlak":
      return (jumlahOpt / jumlahAnakan) * 100
    case "tidak mutlak":
      return (jumlahOpt / 270) * 100
    case "ekor/rumpun":
      return (jumlahOpt / 30)
    case "ekor/m2":
      return (jumlahOpt / 2)
    case "ma":
      return (jumlahOpt / 30)
    default:
      break;
  }
}
