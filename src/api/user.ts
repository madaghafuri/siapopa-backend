import { Hono } from 'hono';
import { authorizeApi } from '../middleware.js';
import { db } from '../index.js';
import { user as userSchema } from '../db/schema/user.js';
import { eq, ilike } from 'drizzle-orm';
import { userGroup } from '../db/schema/user-group.js';

export const user = new Hono();

user.use('/user/*', authorizeApi);
user.get('/user', async (c) => {
  const query = c.req.query('q');
  const name = `%${query}%`;

  try {
    var selectUser = await db
      .select({
        id: userSchema.id,
        email: userSchema.email,
        phone: userSchema.phone,
        name: userSchema.name,
        validasi: userSchema.validasi,
        photo: userSchema.photo,
        user_group: userGroup,
      })
      .from(userSchema)
      .leftJoin(userGroup, eq(userGroup.id, userSchema.usergroup_id))
      .where(ilike(userSchema.name, name))
      .limit(50);
  } catch (error) {
    return c.json(
      {
        status: 500,
        message: 'internal server error',
      },
      500
    );
  }

  return c.json({
    status: 200,
    message: 'success',
    data: selectUser,
  });
});
