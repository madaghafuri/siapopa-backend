import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    database: process.env.DB_NAME || 'siapopa-dev',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'postgres',
    user: process.env.DB_USER || 'postgres',
    port: 5432,
    ssl: false,
  },
});
