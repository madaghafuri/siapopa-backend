import { Hono } from "hono";
import { JwtVariables } from "hono/jwt";
import { validator } from "hono/validator";
import {
  Pengamatan,
  pengamatan as pengamatanSchema,
} from "../db/schema/pengamatan";
import { db } from "..";
import { Lokasi, lokasi } from "../db/schema/lokasi";
import { PgColumn, PgPointTuple } from "drizzle-orm/pg-core";
import { SQL, and, eq, inArray, or, sql } from "drizzle-orm";
import {
  PhotoPengamatan,
  photoPengamatan,
} from "../db/schema/photo-pengamatan";
import { provinsi } from "../db/schema/provinsi";
import { kabupatenKota } from "../db/schema/kabupaten-kota";
import { kecamatan } from "../db/schema/kecamatan";
import { desa } from "../db/schema/desa";
import {
  DetailRumpun,
  Kerusakan,
  detailRumpun,
} from "../db/schema/detail-rumpun";
import {
  InsertRumpun,
  rumpun,
  rumpun as rumpunSchema,
} from "../db/schema/rumpun";
import { tanaman } from "../db/schema/tanaman";
import { user } from "../db/schema/user";
import { withPagination, withQueries } from "./helper";

export const pengamatan = new Hono<{ Variables: JwtVariables }>();

pengamatan.post(
  "/pengamatan",
  validator("json", (value, c) => {
    const { lokasi_id, tanaman_id, ...rest } = value as Pengamatan & {
      lokasi_pengamatan: {
        type: string;
        coordinates: [number, number];
      };
      bukti_pengamatan: string[];
      rumpun: {
        rumpun_ke: number;
        jumlah_anakan: number;
        detail_rumpun: {
          opt_id: number;
          jumlah_opt: number;
          skala_kerusakan: Kerusakan;
          hama_id: number;
          jumlah_hama: number;
        }[];
      }[];
    };

    if (!lokasi_id || !tanaman_id) {
      return c.json(
        {
          status: 401,
          message: "lokasi_id tidak ditemukan",
        },
        401,
      );
    }
    const parsedValue = { lokasi_id, tanaman_id, ...rest };

    return parsedValue;
  }),
  // Context Route Handler
  async (c) => {
    const { lokasi_pengamatan, bukti_pengamatan, lokasi_id, rumpun, ...rest } =
      c.req.valid("json");

    const [lat, long] = lokasi_pengamatan.coordinates;

    const photoValue: Partial<PhotoPengamatan>[] = bukti_pengamatan.map(
      (val) => ({
        path: val,
        pengamatan_id: insertedData[0].id,
      }),
    );
    try {
      var insertedData = await db
        .insert(pengamatanSchema)
        .values({ ...rest, point_pengamatan: [lat, long] })
        .returning();

      if (rumpun.length > 0) {
        const rumpunData: InsertRumpun[] = rumpun.map(
          ({ rumpun_ke, jumlah_anakan }) => ({
            rumpun_ke,
            jumlah_anakan,
            pengamatan_id: insertedData[0].id,
          }),
        );

        var insertRumpun = await db
          .insert(rumpunSchema)
          .values(rumpunData)
          .returning();

        const detailRumpunData = rumpun.flatMap((val) => {
          const dataRumpun = insertRumpun.find(
            (val) => val.rumpun_ke === val.rumpun_ke,
          );
          const li = val.detail_rumpun.map((val) => {
            return { ...val, rumpun_id: dataRumpun?.id };
          });
          return li;
        });

        await db.insert(detailRumpun).values(detailRumpunData);
      }

      await db.insert(photoPengamatan).values(photoValue);
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
      message: "Berhasil membuat data pengamatan",
      data: insertedData[0],
    });
  },
);
pengamatan.put(
  "/pengamatan/:pengamatanId",
  validator("param", (value, c) => {
    const pengamatanId = value["pengamatanId"];
    if (!pengamatanId)
      return c.json(
        {
          status: 401,
          message: "parameter pengamatan_id harus berada di url",
        },
        401,
      );
    return pengamatanId;
  }),

  validator("json", (value, c) => {
    const { lokasi_id, lokasi_pengamatan, pic_id, ...rest } =
      value as Pengamatan & {
        lokasi_pengamatan: {
          type: "Point" | "Polygon";
          coordinates: [number, number];
        };
        bukti_pengamatan: {
          bukti_pengamatan_id: number;
          photo_pengamatan: string;
        }[];
      };

    if (!lokasi_id || !lokasi_pengamatan || !pic_id) {
      return c.json(
        {
          status: 401,
          message:
            "Permintaan harus memiliki lokasi_id, lokasi_pengamatan, dan pic_id",
        },
        401,
      );
    }

    return { lokasi_id, lokasi_pengamatan, pic_id, ...rest };
  }),
  async (c) => {
    const pengamatanId = c.req.param("pengamatanId");
    const { lokasi_pengamatan, bukti_pengamatan, point_pengamatan, ...rest } =
      c.req.valid("json");
    const [lat, long] = lokasi_pengamatan.coordinates;

    try {
      var updatedData = await db
        .update(pengamatanSchema)
        .set({ point_pengamatan: [lat, long], ...rest })
        .where(eq(pengamatanSchema.id, parseInt(pengamatanId)))
        .returning();

      const sqlChunks: SQL[] = [];
      const ids: number[] = [];
      sqlChunks.push(sql`(case`);
      for (const input of bukti_pengamatan) {
        sqlChunks.push(
          sql`when id = ${input.bukti_pengamatan_id} then ${input.photo_pengamatan}`,
        );
        ids.push(input.bukti_pengamatan_id);
      }
      sqlChunks.push(sql`end)`);

      await db
        .update(photoPengamatan)
        .set({ path: sql.join(sqlChunks, sql.raw(" ")) })
        .where(
          and(
            inArray(photoPengamatan.id, ids),
            eq(photoPengamatan.pengamatan_id, parseInt(pengamatanId)),
          ),
        );
    } catch (error) {
      console.error(error);
      return c.json({
        status: 500,
        message: "internal server error",
      });
    }

    return c.json({
      status: 200,
      message: "success",
      data: updatedData[0],
    });
  },
);
pengamatan.delete("/pengamatan/:pengamatanId", async (c) => {
  const pengamatanId = c.req.param("pengamatanId");

  try {
    await db
      .delete(pengamatanSchema)
      .where(eq(pengamatanSchema.id, parseInt(pengamatanId)));
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
    message: "success",
  });
});
pengamatan.get("/pengamatan/:pengamatanId", async (c) => {
  const pengamatanId = c.req.param("pengamatanId");

  const data = db
    .select({ pengamatan: pengamatanSchema, detail_rumpun: detailRumpun })
    .from(pengamatanSchema)
    .leftJoin(rumpun, eq(rumpun.pengamatan_id, pengamatanSchema.id))
    .leftJoin(detailRumpun, eq(detailRumpun.rumpun_id, rumpun.id))
    .where(eq(pengamatanSchema.id, parseInt(pengamatanId)));

  const result = (await data).reduce<
    Record<number, { pengamatan: Pengamatan; detail_rumpun: DetailRumpun[] }>
  >((acc, row) => {
    const pengamatan = row.pengamatan;
    const detail = row.detail_rumpun;

    if (!acc[pengamatan.id]) {
      acc[pengamatan.id] = { pengamatan, detail_rumpun: [] };
    }

    if (detail) {
      acc[pengamatan.id].detail_rumpun.push(detail);
    }

    return acc;
  }, {});

  if (!result) {
    return c.json({
      status: 404,
      message: "data tidak ditemukan",
    });
  }

  return c.json({
    status: 200,
    message: "success",
    data: result,
  });
});
pengamatan.get("/pengamatan", async (c) => {
  const { page, per_page, lokasi_id, user_id, tanggal_pengamatan } =
    c.req.query() as Record<
      "lokasi_id" | "user_id" | "tanggal_pengamatan" | "page" | "per_page",
      string
    >;

  const pengamatanQuery = db
    .select()
    .from(pengamatanSchema)
    .where(
      and(
        !!lokasi_id ? eq(pengamatanSchema.lokasi_id, lokasi_id) : undefined,
        !!user_id ? eq(pengamatanSchema.pic_id, parseInt(user_id)) : undefined,
        !!tanggal_pengamatan
          ? eq(pengamatanSchema.tanggal_pengamatan, tanggal_pengamatan)
          : undefined,
      ),
    )
    .$dynamic();

  try {
    const finalQuery = withPagination(
      pengamatanQuery,
      parseInt(page),
      parseInt(per_page),
    );
    var selectedPengamatan = await finalQuery;
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

  if (selectedPengamatan.length === 0) {
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
    data: selectedPengamatan,
  });
});
