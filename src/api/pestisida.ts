import { Hono } from "hono";
import { db } from "..";
import { authorizeApi } from "../middleware";

export const pestisidaRoute = new Hono().basePath('/pestisida')
pestisidaRoute.use('*', authorizeApi)

pestisidaRoute.get('/', async (c) => {
  const { page, per_page, bahan_aktif_id } = c.req.query();

  const pestisidaData = await db.query.pestisida.findMany({
    with: {
      bahan_aktif: true,
      opt: true,
      tanaman: true,
    },
    where: (pestisida, { and, eq }) => and(!!bahan_aktif_id ? eq(pestisida.bahan_aktif_id, parseInt(bahan_aktif_id)) : undefined),
    limit: parseInt(per_page || '10'),
    offset: (parseInt(page || '1') - 1) * parseInt(per_page || '10')
  })

  return c.json({
    status: 200,
    message: "success",
    data: pestisidaData
  })
})
pestisidaRoute.get('/:id', async (c) => {
  const pestisidaId = c.req.param('id');

  const pestisidaData = await db.query.pestisida.findMany({
    with: {
      bahan_aktif: true,
      opt: true,
      tanaman: true,
    },
    where: (pestisida, { eq }) => eq(pestisida.id, parseInt(pestisidaId))
  })

  return c.json({
    status: 200,
    message: "success",
    data: pestisidaData
  })
})
