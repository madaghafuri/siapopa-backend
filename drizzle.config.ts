import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    database: "siapopa-dev",
    host: "localhost",
    password: "postgres",
    user: "postgres",
    port: 5432,
    ssl: false,
  },
});
