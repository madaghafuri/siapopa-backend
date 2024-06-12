import { Hono } from "hono";
import { JwtVariables } from "hono/jwt";
import { validator } from "hono/validator";
import {
  Pengamatan,
  pengamatan as pengamatanSchema,
} from "../../db/schema/pengamatan";
import { db } from "..";
import { Lokasi, lokasi } from "../../db/schema/lokasi";
import { PgColumn, PgPointTuple } from "drizzle-orm/pg-core";
import { SQL, and, eq, or, sql } from "drizzle-orm";
import {
  PhotoPengamatan,
  photoPengamatan,
} from "../../db/schema/photo-pengamatan";
import { provinsi } from "../../db/schema/provinsi";
import { kabupatenKota } from "../../db/schema/kabupaten-kota";
import { kecamatan } from "../../db/schema/kecamatan";
import { desa } from "../../db/schema/desa";
import { detailRumpun } from "../../db/schema/detail-rumpun";
import { rumpun } from "../../db/schema/rumpun";
import { tanaman } from "../../db/schema/tanaman";
import { user } from "../../db/schema/user";
import { withQueries } from "./helper";

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
    };

    if (!lokasi_id || !tanaman_id) {
      return c.json(
        {
          status: 401,
          message: "lokasi_id tidak ditemukan",
        },
        401
      );
    }
    const parsedValue = { lokasi_id, tanaman_id, ...rest };

    return parsedValue;
  }),
  // Context Route Handler
  async (c) => {
    const { lokasi_pengamatan, bukti_pengamatan, lokasi_id, ...rest } =
      c.req.valid("json");

    const [lat, long] = lokasi_pengamatan.coordinates;

    const photoValue: Partial<PhotoPengamatan>[] = bukti_pengamatan.map(
      (val) => ({
        path: val,
        pengamatan_id: insertedData[0].id,
      })
    );
    try {
      var insertedData = await db
        .insert(pengamatanSchema)
        .values({ ...rest, point_pengamatan: [lat, long] })
        .returning();

      await db.insert(photoPengamatan).values(photoValue).returning();
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

    const dataLokasi = await db
      .select()
      .from(lokasi)
      .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
      .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
      .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
      .leftJoin(desa, eq(desa.id, lokasi.desa_id))
      .where(eq(lokasi.id, lokasi_id));

    if (dataLokasi.length === 0) {
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
      message: "Berhasil membuat data pengamatan",
      data: {
        ...insertedData[0],
        lokasi_pengamatan: {
          type: "Point",
          coordinates: [lat, long],
        },
        bukti_pengamatan,
        lokasi: {
          provinsi: dataLokasi[0].provinsi?.nama_provinsi,
          kabkot: dataLokasi[0].kabupaten_kota?.nama_kabkot,
          kecamatan: dataLokasi[0].kecamatan?.nama_kecamatan,
          desa: dataLokasi[0].desa?.nama_desa,
        },
      },
    });
  }
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
        401
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
        bukti_pengamatan: string[];
      };

    if (!lokasi_id || !lokasi_pengamatan || !pic_id) {
      return c.json(
        {
          status: 401,
          message:
            "Permintaan harus memiliki lokasi_id, lokasi_pengamatan, dan pic_id",
        },
        401
      );
    }

    return { lokasi_id, lokasi_pengamatan, pic_id, ...rest };
  }),
  async (c) => {
    const pengamatanId = c.req.param("pengamatanId");
    const { lokasi_pengamatan, bukti_pengamatan, point_pengamatan, ...rest } =
      c.req.valid("json");

    // const dataPhoto: typeof photoPengamatan.$inferInsert[] = bukti_pengamatan.map(
    //   (val) => ({
    //     path: val,
    //     pengamatan_id: pengamatanId,
    //   })
    // );
    const [lat, long] = lokasi_pengamatan.coordinates;

    try {
      var insertedData = await db
        .update(pengamatanSchema)
        .set({ point_pengamatan: [lat, long], ...rest })
        .where(eq(pengamatanSchema.id, parseInt(pengamatanId)))
        .returning();

      // const inertedPhoto = await db
      //   .update(photoPengamatan)
      //   .set({ path: sql`when id = ` })
      //   .where(eq(photoPengamatan.pengamatan_id, parseInt(pengamatanId)));
    } catch (error) {
      console.error(error);
      return c.json({
        status: 500,
        message: "internal server error",
      });
    }

    return c.json({
      status: 200,
      message: "Hold on",
    });
  }
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
      500
    );
  }

  return c.json({
    status: 200,
    message: "success",
  });
});
pengamatan.get("/pengamatan/:pengamatanId", async (c) => {
  const pengamatanId = c.req.param("pengamatanId");

  const bro = pengamatanSchema.$inferSelect;

  const data = await db
    .select({
      id_pengamatan: pengamatanSchema.id,
      tanaman_id: pengamatanSchema.tanaman_id,
      tanaman: tanaman.nama_tanaman,
      lokasi_id: pengamatanSchema.lokasi_id,
      hari_ke: pengamatanSchema.hari_ke,
      blok: pengamatanSchema.blok,
      luas_hamparan: pengamatanSchema.luas_hamparan,
      luas_diamati: pengamatanSchema.luas_diamati,
      luas_hasil_panen: pengamatanSchema.luas_hasil_panen,
      luas_persemaian: pengamatanSchema.luas_persemaian,
      ph_tanah: pengamatanSchema.ph_tanah,
      komoditas: pengamatanSchema.komoditas,
      variatas: pengamatanSchema.varietas,
      dari_umur: pengamatanSchema.dari_umur,
      hingga_umur: pengamatanSchema.hingga_umur,
      pola_tanam: pengamatanSchema.pola_tanam,
      pic_id: pengamatanSchema.pic_id,
      pic_name: user.name,
      sign_pic: pengamatanSchema.sign_pic,
      tanggal_pengamatan: pengamatanSchema.tanggal_pengamatan,
      status_laporan_harian: pengamatanSchema.status_laporan_harian,
      lokasi_pengamatan: {
        type: sql`TEXT`,
        coordinates: pengamatanSchema.point_pengamatan,
      },
    })
    .from(pengamatanSchema)
    .leftJoin(
      photoPengamatan,
      eq(photoPengamatan.pengamatan_id, pengamatanSchema.id)
    )
    .leftJoin(lokasi, eq(lokasi.id, pengamatanSchema.lokasi_id))
    .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
    .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
    .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
    .leftJoin(desa, eq(lokasi.desa_id, desa.id))
    .leftJoin(rumpun, eq(rumpun.pengamatan_id, parseInt(pengamatanId)))
    .leftJoin(detailRumpun, eq(detailRumpun.rumpun_id, rumpun.id))
    .leftJoin(tanaman, eq(tanaman.id, pengamatanSchema.tanaman_id))
    .leftJoin(user, eq(user.id, pengamatanSchema.pic_id))
    .where(eq(pengamatanSchema.id, parseInt(pengamatanId)));

  if (data.length === 0) {
    return c.json({
      status: 404,
      message: "data tidak ditemukan",
    });
  }

  return c.json({
    status: 200,
    message: "success",
    data: data[0],
  });
});
pengamatan.get(
  "/pengamatan",
  validator("query", (value, c) => {
    const { lokasi_id, user_id, tanggal_pengamatan } = value;

    return value;
  }),
  async (c) => {
    const { page, per_page, ...rest } = c.req.query() as Record<
      "lokasi_id" | "user_id" | "tanggal_pengamatan" | "page" | "per_page",
      string
    >;

    const queries = Object.entries(rest);
    const offsetPage = ((parseInt(page) || 1) - 1) * parseInt(per_page) || 10;

    const pengamatanQuery = db
      .select()
      .from(pengamatanSchema)
      .leftJoin(lokasi, eq(lokasi.id, pengamatanSchema.lokasi_id))
      .leftJoin(provinsi, eq(provinsi.id, lokasi.provinsi_id))
      .leftJoin(kabupatenKota, eq(kabupatenKota.id, lokasi.kabkot_id))
      .leftJoin(kecamatan, eq(kecamatan.id, lokasi.kecamatan_id))
      .leftJoin(desa, eq(desa.id, lokasi.desa_id))
      .$dynamic();

    try {
      const finalQuery = withQueries(pengamatanQuery, queries)
        .limit(parseInt(per_page) || 10)
        .offset(offsetPage);
      var selectedPengamatan = await finalQuery;
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

    if (selectedPengamatan.length === 0) {
      return c.json(
        {
          status: 404,
          message: "Data tidak ditemukan",
        },
        404
      );
    }

    return c.json({
      status: 200,
      message: "success",
      data: selectedPengamatan[0],
    });
  }
);
