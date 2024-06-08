import { serve } from "@hono/node-server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: "postgres://postgres:postgres@db:5432/siapopa-dev",
});
await client.connect();
const db = drizzle(client);

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Yes This is it!");
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
