import { Hono } from "hono";
import { validator } from "hono/validator";
import {
  InsertLaporanHarian,
  LaporanHarian,
  laporanHarian as laporanHarianSchema,
} from "../db/schema/laporan-harian.js";
import { db } from "../index.js";
import { and, eq, gte, lte } from "drizzle-orm";
import { Lokasi, lokasi } from "../db/schema/lokasi.js";
import { pengamatan } from "../db/schema/pengamatan.js";
import { rumpun } from "../db/schema/rumpun.js";
import { DetailRumpun, detailRumpun } from "../db/schema/detail-rumpun.js";
import { withPagination } from "./helper.js";
import { authorizeApi } from "../middleware.js";

export const laporanHarian = new Hono();

laporanHarian.use("/laporan_harian/*", authorizeApi);

laporanHarian.post(
  "/laporan_harian",
  validator("json", (value, c) => {
    const { pengamatan_id, opt_id, lokasi_id, ...rest } =
      value as InsertLaporanHarian & {
        lokasi_id: string;
        lokasi_laporan_harian: { type: string; coordinates: [number, number] };
      };

    if (!pengamatan_id || !opt_id || !lokasi_id) {
      return c.json(
        {
          status: 401,
          message:
            "Tidak dapat melanjutkan permintaan. pengamatan_id, opt_id, lokasi_id tidak ditemukan",
        },
        401,
      );
    }

    return { pengamatan_id, opt_id, lokasi_id, ...rest };
  }),
  async (c) => {
    const { lokasi_laporan_harian, lokasi_id, ...rest } = c.req.valid("json");
    const [lat, long] = lokasi_laporan_harian.coordinates;

    try {
      var insertedData = await db
        .insert(laporanHarianSchema)
        .values({ ...rest, point_laporan_harian: [lat, long] })
        .returning();
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

    if (insertedData.length === 0) {
      return c.json(
        {
          status: 404,
          message: "Data tidak ditemukan",
        },
        404,
      );
    }

    return c.json({
      status: 200,
      message: "success",
      data: { ...insertedData[0], lokasi_id },
    });
  },
);
laporanHarian.put(
  "/laporan_harian/:laporanHarianId",
  validator("json", (value, c) => {
    const { lokasi_id, lokasi_laporan_harian, ...rest } =
      value as InsertLaporanHarian & {
        lokasi_id: string;
        lokasi_laporan_harian: {
          type: string;
          coordinates: [number, number];
        };
      };

    return { lokasi_id, lokasi_laporan_harian, ...rest };
  }),
  async (c) => {
    const laporanHarianId = c.req.param("laporanHarianId");
    const { lokasi_id, lokasi_laporan_harian, ...rest } = c.req.valid("json");

    try {
      var updatedData = await db
        .update(laporanHarianSchema)
        .set({ ...rest })
        .where(eq(laporanHarianSchema.id, parseInt(laporanHarianId)))
        .returning();
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
      message: "Berhasil mengupdate laporan harian",
    });
  },
);
laporanHarian.delete("/laporan_harian/:laporanHarianId", async (c) => {
  const laporanHarianId = c.req.param("laporanHarianId");

  try {
    await db
      .delete(laporanHarianSchema)
      .where(eq(laporanHarianSchema.id, parseInt(laporanHarianId)));
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
    message: "Berhasil menghapus data laporan harian",
  });
});
laporanHarian.get("/laporan_harian/:laporanHarianId", async (c) => {
  const laporanHarianId = c.req.param("laporanHarianId");

  try {
    var dataLaporan = await db
      .select({
        laporan_harian: laporanHarianSchema,
        lokasi,
        detail_rumpun: detailRumpun,
      })
      .from(laporanHarianSchema)
      .leftJoin(
        pengamatan,
        eq(pengamatan.id, laporanHarianSchema.pengamatan_id),
      )
      .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
      .leftJoin(rumpun, eq(rumpun.pengamatan_id, pengamatan.id))
      .leftJoin(detailRumpun, eq(detailRumpun.rumpun_id, rumpun.id))
      .where(eq(laporanHarianSchema.id, parseInt(laporanHarianId)));

    var data = dataLaporan.reduce<
      Record<
        number,
        {
          laporan_harian: LaporanHarian;
          detail_rumpun: DetailRumpun[];
          lokasi: Lokasi;
        }
      >
    >((acc, row) => {
      const laporanHarian = row.laporan_harian;
      const detailRumpun = row.detail_rumpun;
      const lokasi = row.lokasi;

      if (!acc[laporanHarian.id]) {
        acc[laporanHarian.id] = {
          laporan_harian: laporanHarian,
          detail_rumpun: [],
          lokasi: null,
        };
      }

      if (detailRumpun) {
        acc[laporanHarian.id].detail_rumpun.push(detailRumpun);
      }

      if (lokasi) {
        acc[laporanHarian.id].lokasi = lokasi;
      }

      return acc;
    }, {});
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

  if (dataLaporan.length === 0) {
    return c.json(
      {
        status: 404,
        message: "Data tidak ditemukan",
      },
      404,
    );
  }

  return c.json({
    status: 200,
    message: "success",
    data: data[laporanHarianId],
  });
});
laporanHarian.get(
  "/laporan_harian",
  validator("query", (value, c) => {
    const query = value as Record<
      | "user_id"
      | "location_id"
      | "tanggal"
      | "start_date"
      | "end_date"
      | "page"
      | "per_page",
      string
    >;
    return query;
  }),
  async (c) => {
    const {
      start_date,
      end_date,
      location_id,
      tanggal,
      user_id,
      page,
      per_page,
    } = c.req.valid("query");

    try {
      const preQuery = db
        .select()
        .from(laporanHarianSchema)
        .leftJoin(
          pengamatan,
          eq(pengamatan.id, laporanHarianSchema.pengamatan_id),
        )
        .leftJoin(lokasi, eq(lokasi.id, pengamatan.lokasi_id))
        .where(
          and(
            !!user_id
              ? eq(laporanHarianSchema.pic_id, parseInt(user_id))
              : undefined,
            !!location_id ? eq(lokasi.id, location_id) : undefined,
            !!tanggal
              ? eq(laporanHarianSchema.tanggal_laporan_harian, tanggal)
              : undefined,
            !!start_date
              ? gte(laporanHarianSchema.tanggal_laporan_harian, start_date)
              : undefined,
            !!end_date
              ? lte(laporanHarianSchema.tanggal_laporan_harian, end_date)
              : undefined,
          ),
        )
        .$dynamic();
      const final = withPagination(
        preQuery,
        parseInt(per_page),
        parseInt(page),
      );
      var selectData = await final;
    } catch (error) {
      console.error(error);
      return c.json({
        status: 500,
        message: "internal server error",
      });
    }

    if (selectData.length === 0) {
      return c.json(
        {
          status: 404,
          message: "Data laporan harian tidak ditemukan",
        },
        404,
      );
    }

    return c.json({
      status: 200,
      message: "success",
      data: selectData,
    });
  },
);
