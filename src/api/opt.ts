import { Hono } from 'hono';
import { authorizeApi } from '../middleware.js';
import { db } from '../index.js';
import { opt as optSchema } from '../db/schema/opt.js';
import { and, eq, ilike } from 'drizzle-orm';

export const opt = new Hono();

opt.use('/opt/*', authorizeApi);
opt.get('/opt', async (c) => {
  const nama_opt = c.req.query('q');
  const nama = `%${nama_opt}%`;

  try {
    var selectOpt = await db
      .select()
      .from(optSchema)
      .where(
        and(
          !!nama_opt ? ilike(optSchema.nama_opt, nama) : undefined,
          eq(optSchema.jenis, 'opt')
        )
      );
  } catch (error) {
    console.error(error);
    return c.json(
      {
        status: 500,
        message: 'internal server error' + error,
      },
      500
    );
  }

  if (selectOpt.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'opt tidak ditemukan',
      },
      404
    );
  }

  return c.json({
    status: 200,
    message: 'success',
    data: selectOpt,
  });
});
opt.get('/opt/ma', async (c) => {
  const nama_ma = c.req.query('ma');
  const nama = `%${nama_ma}%`;

  try {
    var selectOpt = await db
      .select()
      .from(optSchema)
      .where(
        and(
          !!nama_ma ? ilike(optSchema.nama_opt, nama) : undefined,
          eq(optSchema.jenis, 'ma')
        )
      );
  } catch (error) {
    console.error(error);
    return c.json(
      {
        status: 500,
        message: 'internal server error' + error,
      },
      500
    );
  }

  if (selectOpt.length === 0) {
    return c.json(
      {
        status: 404,
        message: 'ma tidak ditemukan',
      },
      404
    );
  }

  return c.json({
    status: 200,
    message: 'success',
    data: selectOpt,
  });
});
