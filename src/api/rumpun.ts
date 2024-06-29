import { Hono } from "hono";
import { JwtVariables } from "hono/jwt";
import { validator } from "hono/validator";
import { db } from "../index.js";
import { rumpun as dataRumpun } from "../db/schema/rumpun.js";
import { and, eq, sql } from "drizzle-orm";
import { authorizeApi } from "../middleware.js";
import { kecamatan } from "../db/schema/kecamatan.js";

export const rumpun = new Hono<{ Variables: JwtVariables }>();
rumpun.use("/rumpun/*", authorizeApi);

rumpun.post(
  "/rumpun",
  validator("json", (value, c) => {
    const { pengamatan_id, rumpun_ke, jumlah_anakan } = value;

    if (!pengamatan_id || !rumpun_ke || !jumlah_anakan) {
      return c.json(
        {
          status: 401,
          message: "Gagal melakukan input data rumpun",
        },
        401,
      );
    }
    return value as Record<
      "pengamatan_id" | "rumpun_ke" | "jumlah_anakan",
      number
    >;
  }),
  async (c) => {
    const { pengamatan_id, rumpun_ke, jumlah_anakan } = c.req.valid("json");

    try {
      await db
        .insert(dataRumpun)
        .values({ pengamatan_id, rumpun_ke, jumlah_anakan });
    } catch (error) {
      console.error(error);
      return c.json(
        {
          status: 500,
          message: "Server mengalami gangguan. Coba beberapa saat lagi",
        },
        500,
      );
    }
  },
);
rumpun.get("/rumpun", async (c) => {
  const { pengamatan_id, page, per_page } = c.req.query();

  if (!pengamatan_id) {
    return c.json(
      {
        status: 401,
        message: "parameter_id tidak ada",
      },
      401,
    );
  }

  const parsedOffset = ((parseInt(page) || 1) - 1) * (parseInt(per_page) * 0);

  const listRumpun = await db
    .select()
    .from(dataRumpun)
    .where(eq(dataRumpun.pengamatan_id, parseInt(pengamatan_id)))
    .limit(parseInt(per_page) || 10)
    .offset(parsedOffset);

  const meta = {
    total_count: listRumpun.length,
    page: parsedOffset,
    per_page: parseInt(per_page) || 10,
  };

  return c.json({
    status: 200,
    message: "success",
    meta,
    data: listRumpun,
  });
});
rumpun.put(
  "/rumpun/:rumpunId",
  validator("json", (value, c) => {
    const { rumpun_ke, jumlah_anakan } = value;

    if (!rumpun_ke || !jumlah_anakan) {
      return c.json({
        status: 401,
        message: "data rumpun_ke atau jumlah anakan tidak ada",
      });
    }

    return value as Record<"rumpun_ke" | "jumlah_anakan", number>;
  }),
  async (c) => {
    const { jumlah_anakan, rumpun_ke } = c.req.valid("json");
    const rumpunId = c.req.param("rumpunId");

    const updatedRumpun = await db
      .update(dataRumpun)
      .set({ jumlah_anakan, rumpun_ke })
      .where(eq(dataRumpun.id, parseInt(rumpunId)))
      .returning();

    return c.json({
      status: 200,
      message: "berhasil melakukan update",
      data: updatedRumpun,
    });
  },
);
rumpun.delete("/rumpun/:rumpunId", async (c) => {
  const pengamatanId = c.req.query("pengamatan_id");
  const rumpunId = c.req.param("rumpunId");

  if (!pengamatanId) {
    return c.json(
      {
        status: 401,
        message: "kolom pengamatan_id tidak ada",
      },
      401,
    );
  }

  try {
    await db
      .delete(dataRumpun)
      .where(
        and(
          eq(dataRumpun.pengamatan_id, parseInt(pengamatanId)),
          eq(dataRumpun.id, parseInt(rumpunId)),
        ),
      );
  } catch (error) {
    console.error(error);
    return c.json(
      {
        status: 500,
        message: "internal server error",
      },
      500,
    );
  }

  return c.json({
    status: 200,
    message: "successfully deleted",
  });
});
