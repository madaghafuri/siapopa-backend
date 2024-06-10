import { Hono } from "hono";
import { JwtVariables } from "hono/jwt";
import { validator } from "hono/validator";
import {
  DetailRumpun,
  detailRumpun as detailRumpunSchema,
} from "../../db/schema/detail-rumpun";
import { db } from "..";
import { eq } from "drizzle-orm";

export const detailRumpun = new Hono<{ Variables: JwtVariables }>();

detailRumpun.post(
  "/",
  validator("json", (value, c) => {
    const { rumpun_id } = value;

    if (!rumpun_id) {
      return c.json(
        {
          status: 401,
          message:
            "Tidak dapat melanjutkan permintaan. Data rumpun_id dibutuhkan",
        },
        401
      );
    }

    return value as DetailRumpun;
  }),
  async (c) => {
    const {
      rumpun_id,
      opt_id,
      jumlah_opt,
      hama_id,
      jumlah_hama,
      skala_kerusakan,
    } = c.req.valid("json");

    const insertedData = await db
      .insert(detailRumpunSchema)
      .values({
        rumpun_id,
        opt_id,
        jumlah_opt,
        hama_id,
        jumlah_hama,
        skala_kerusakan,
      })
      .returning();

    if (insertedData.length === 0) {
      return c.json(
        {
          status: 500,
          message: "internal server error",
        },
        500
      );
    }

    return c.json({
      status: 200,
      message: "Berhasil input data OPT",
      data: insertedData[0],
    });
  }
);
detailRumpun.get(
  "/",
  validator("query", (value, c) => {
    const { rumpun_id } = value;

    if (!rumpun_id) {
      return c.json(
        {
          status: 401,
          message:
            "Permintaan tidak dapat dilanjutkan. Data rumpun_id tidak adak",
        },
        401
      );
    }
    return value as Record<"rumpun_id" | "page" | "per_page", string>;
  }),
  async (c) => {
    const { rumpun_id, page, per_page } = c.req.valid("query");

    const parsedOffset = ((parseInt(page) || 1) - 1) * parseInt(per_page) || 10;

    const listDetailRumpun = await db
      .select()
      .from(detailRumpunSchema)
      .where(eq(detailRumpunSchema.rumpun_id, parseInt(rumpun_id)))
      .limit(parseInt(per_page) || 10)
      .offset(parsedOffset);

    if (listDetailRumpun.length === 0) {
      return c.json(
        {
          status: 404,
          message: "Detail rumpun tidak ditemukan",
        },
        404
      );
    }

    return c.json({
      status: 200,
      message: "success",
      data: listDetailRumpun,
    });
  }
);
detailRumpun.delete("/:detailRumpunId", async (c) => {
  const detailRumpunId = c.req.param("detailRumpunId");

  try {
    await db
      .delete(detailRumpunSchema)
      .where(eq(detailRumpunSchema.id, parseInt(detailRumpunId)));
  } catch (error) {
    console.error(error);
    return c.json(
      {
        status: 500,
        message: "internal server error",
      },
      500
    );
  }

  return c.json({
    status: 200,
    message: "success",
  });
});
detailRumpun.put(
  "/:detailRumpunId",
  validator("json", (value, c) => {
    const {
      detail_rumpun_id,
      pengamatan_id,
      opt_id,
      jumlah_opt,
      hama_id,
      jumlah_hama,
      skala_kerusakan,
    } = value;
    return value as DetailRumpun;
  }),
  async (c) => {
    const detailRumpunId = c.req.param("detailRumpunId");
    const { opt_id, jumlah_opt, hama_id, jumlah_hama, skala_kerusakan } =
      c.req.valid("json");

    const updatedDetailRumpun = await db
      .update(detailRumpunSchema)
      .set({ opt_id, jumlah_opt, hama_id, jumlah_hama, skala_kerusakan })
      .where(eq(detailRumpunSchema, parseInt(detailRumpunId)))
      .returning();

    if (updatedDetailRumpun.length === 0) {
      return c.json(
        {
          status: 500,
          message: "internal server error",
        },
        500
      );
    }

    return c.json({
      status: 200,
      message: "Berhasil update data OPT",
      data: updatedDetailRumpun[0],
    });
  }
);
