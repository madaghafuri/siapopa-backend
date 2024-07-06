import { Hono } from 'hono';
import { authorizeApi } from '../middleware.js';
import { db } from '../index.js';
import { userGroup as userGroupSchema } from '../db/schema/user-group.js';
import { ilike } from 'drizzle-orm';

export const userGroup = new Hono();

userGroup.use('/user_group/*', authorizeApi);

userGroup.get('/user_group', async (c) => {
  const query = c.req.query('q');
  const groupName = `%${query}%`;

  try {
    var selectUserGroup = await db
      .select()
      .from(userGroupSchema)
      .where(ilike(userGroupSchema.group_name, groupName))
      .limit(50)
      .offset(0);
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
    data: selectUserGroup,
  });
});
