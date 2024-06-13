import { Hono } from "hono";
import { validator } from "hono/validator";
import {
  InsertLaporanBulanan,
  laporanBulanan as laporanBulananSchema,
} from "../../db/schema/laporan-bulanan";
import { db } from "..";
import { and, eq, gte, lte } from "drizzle-orm";
import { laporanSb } from "../../db/schema/laporan-sb";
import { user } from "../../db/schema/user";
import { lokasi } from "../../db/schema/lokasi";

export const laporanBulanan = new Hono();

laporanBulanan.post(
  "/laporan_bulanan",
  validator("json", (value, c) => {
    const { opt_id, pic_id, lokasi_id, ...rest } =
      value as InsertLaporanBulanan & {
        lokasi_laporan_bulanan: { type: string; coordinates: [number, number] };
        lokasi_id: string;
      };

    if (!opt_id || !lokasi_id || !pic_id) {
      return c.json(
        {
          status: 401,
          message: "missing required data",
        },
        401
      );
    }

    return { opt_id, pic_id, lokasi_id, ...rest };
  }),
  async (c) => {
    const { lokasi_laporan_bulanan, lokasi_id, ...rest } = c.req.valid("json");
    const [lat, long] = lokasi_laporan_bulanan.coordinates;

    try {
      var insertLaporan = await db
        .insert(laporanBulananSchema)
        .values({ ...rest, point: [lat, long] })
        .returning();
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
      data: insertLaporan[0],
    });
  }
);
laporanBulanan.put(
  "/laporan_bulanan/:laporanBulananId",
  validator("json", (value, c) => {
    const data = value as InsertLaporanBulanan & {
      lokasi_id: string;
      lokasi_laporan_bulanan: {
        type: string;
        coordinates: [number, number];
      };
    };

    return data;
  }),
  async (c) => {
    const { lokasi_laporan_bulanan, ...rest } = c.req.valid("json");
    const laporanBulananId = c.req.param("laporanBulananId");
    const [lat, long] = lokasi_laporan_bulanan.coordinates;

    try {
      var updatedData = await db
        .update(laporanBulananSchema)
        .set({ ...rest, point: [lat, long] })
        .where(eq(laporanBulananSchema.id, parseInt(laporanBulananId)))
        .returning();
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
      data: updatedData[0],
    });
  }
);
laporanBulanan.delete("/laporan_bulanan/:laporanBulananId", async (c) => {
  const laporanBulananId = c.req.param("laporanBulananId");

  try {
    await db
      .delete(laporanBulananSchema)
      .where(eq(laporanBulananSchema.id, parseInt(laporanBulananId)));
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
    message: "Berhasil menghapus laporan bulanan",
  });
});
laporanBulanan.get("/laporan_bulanan/:laporanBulananId", async (c) => {
  const laporanBulananId = c.req.param("laporanBulananId");

  try {
    var selectData = await db
      .select()
      .from(laporanBulananSchema)
      .leftJoin(
        laporanSb,
        eq(laporanSb.laporan_bulanan_id, laporanBulananSchema.id)
      )
      .where(eq(laporanBulananSchema.id, parseInt(laporanBulananId)));
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

  if (selectData.length === 0) {
    return c.json(
      {
        status: 404,
        message: "Data laporan bulanan tidak ditemukan",
      },
      404
    );
  }

  return c.json({
    status: 200,
    message: "succes",
    data: selectData[0],
  });
});
laporanBulanan.get("/laporan_bulanan", async (c) => {
  const { user_id, location_id, start_date, end_date } =
    c.req.query() as Record<
      "user_id" | "location_id" | "start_date" | "end_date",
      string
    >;

  try {
    var selectData = await db
      .select()
      .from(laporanBulananSchema)
      .leftJoin(user, eq(user.id, laporanBulananSchema.pic_id))
      .leftJoin(
        laporanSb,
        eq(laporanSb.laporan_bulanan_id, laporanBulananSchema.id)
      )
      .where(
        and(
          !!user_id ? eq(user.id, parseInt(user_id)) : undefined,
          !!location_id ? eq(lokasi.id, location_id) : undefined,
          !!start_date
            ? gte(laporanBulananSchema.start_date, start_date)
            : undefined,
          !!end_date ? lte(laporanBulananSchema.end_date, end_date) : undefined
        )
      );
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

  if (selectData.length === 0) {
    return c.json(
      {
        status: 404,
        message: "Laporan bulanan tidak ditemukan",
      },
      404
    );
  }

  return c.json({
    status: 200,
    message: "success",
    data: selectData,
  });
});
