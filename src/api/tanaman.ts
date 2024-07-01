import { Hono } from "hono"
import { authorizeApi } from "../middleware";
import { db } from "..";
import { tanaman as tanamanSchema } from "../db/schema/tanaman.js"
import { like } from "drizzle-orm";

export const tanaman = new Hono();

tanaman.use("/tanaman/*", authorizeApi);
tanaman.get("/tanaman", async (c) => {
  const query = c.req.query("q");
  const nama = `%${query}%`;

  try {
    var selectTanaman = await db.select().from(tanamanSchema).where(!!query ? like(tanamanSchema.nama_tanaman, nama) : undefined).limit(10).offset(0)
  } catch (error) {
    console.error(error);
    return c.json({
      status: 500,
      message: "internal server error" + error
    }, 500)
  }

  if (selectTanaman.length === 0) {
    return c.json({
      status: 404,
      message: "Data tanaman tidak ditemukan"
    }, 404)
  }

  return c.json({
    status: 200,
    message: "success",
    data: selectTanaman
  })
})


