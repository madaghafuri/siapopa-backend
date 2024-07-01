import { Hono } from "hono";
import { authorizeApi } from "../middleware.js"
import { db } from "../index.js";
import { hama as hamaSchema } from "../db/schema/makhluk-asing.js"
import { like } from "drizzle-orm";

export const hama = new Hono();
hama.use("/hama/*", authorizeApi);

hama.get("/hama", async (c) => {
  const nama_hama = c.req.query("q");
  const nama = `%${nama_hama}$`

  try {
    var selectHama = await db.select().from(hamaSchema).where(!!nama_hama ? like(hamaSchema.hama, nama) : undefined).limit(10);
  } catch (error) {
    console.error(error);
    return c.json({
      status: 500,
      message: "internal server error" + error
    }, 500)
  }

  if (selectHama.length === 0) {
    return c.json({
      status: 404,
      message: "hama tidak ditemukan"
    }, 404)
  }

  return c.json({
    status: 200,
    message: "succes",
    data: selectHama
  })

})
