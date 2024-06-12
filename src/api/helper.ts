import { SQL, sql } from "drizzle-orm";
import { PgSelect } from "drizzle-orm/pg-core";

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
