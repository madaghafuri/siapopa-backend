import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "../index.js";

await migrate(db, { migrationsFolder: "./drizzle" });
