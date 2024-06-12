import { SQL, sql } from "drizzle-orm";
import { PgSelect } from "drizzle-orm/pg-core";

export function withQueries<T extends PgSelect>(
  qb: T,
  queries: [string, string][]
) {
  const sqlChunks: SQL[] = [];
  if (queries.length > 0) {
    queries.forEach(([key, value], index, arr) => {
      sqlChunks.push(sql`${key} = ${value}`);
      if (index === arr.length - 1) return;
      sqlChunks.push(sql`and`);
    });

    return qb.where(sql.join(sqlChunks, sql.raw(" ")));
  }

  return qb;
}
