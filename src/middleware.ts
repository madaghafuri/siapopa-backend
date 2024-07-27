import { Session } from 'hono-sessions';
import { createMiddleware } from 'hono/factory';
import { db, lucia } from './index';
import { eq } from 'drizzle-orm';
import { user } from './db/schema/user';

export const authorize = createMiddleware<{
  Variables: { session: Session; session_rotation_key: boolean };
}>(async (c, next) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  if (!userId) {
    return c.redirect('/login');
  }
  await next();
});

export const authorizeApi = createMiddleware(async (c, next) => {
  const authorizationHeader = c.req.header('Authorization');

  const token = lucia.readBearerToken(authorizationHeader ?? '');
  if (!token)
    return c.json(
      {
        status: 401,
        message: 'Bearer token missing from request header',
      },
      401
    );
  const { session, user } = await lucia.validateSession(token);

  if (!session || !user) {
    return c.json(
      {
        status: 401,
        message: 'Bearer token is invalid',
      },
      401
    );
  }

  await next();
});

export const authorizeStockInput = createMiddleware<{
  Variables: { session: Session; session_rotation_key: boolean };
}>(async (c, next) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  console.log('authorizeWebInput middleware triggered');
  console.log('Session:', session);
  console.log('User ID:', userId);

  if (!userId && c.req.header('HX-Request')) {
    console.log('User not authorized via HX-Request');
    return c.text('Unauthorized', 302, {
      'HX-Redirect': '/login',
    });
  } else if (!userId) {
    console.log('User not authorized');
    return c.redirect('/login');
  }

  const selectUser = await db.query.user.findFirst({
    with: {
      userGroup: true,
    },
    where: eq(user.id, parseInt(userId)),
  });

  console.log('Selected User:', selectUser);

  if (!selectUser && c.req.header('hx-request')) {
    console.log('Selected user not found via HX-Request');
    return c.text('Unauthorized', 302, {
      'HX-Reswap': 'none',
      'HX-Redirect': '/login',
    });
  } else if (!selectUser) {
    console.log('Selected user not found');
    return c.redirect('/app/dashboard');
  }

  if (
    c.req.header('hx-request') &&
    selectUser.userGroup.group_name !== 'brigade'
  ) {
    console.log('User group not authorized via HX-Request');
    return c.text('Unauthorized', 302, {
      'HX-Reswap': 'none',
      'HX-Redirect': '/login',
    });
  } else if (selectUser.userGroup.group_name !== 'brigade') {
    console.log('User group not authorized');
    return c.redirect('/app/dashboard');
  }

  await next();
});


export const authorizeWebInput = createMiddleware<{
  Variables: { session: Session; session_rotation_key: boolean };
}>(async (c, next) => {
  const session = c.get('session');
  const userId = session.get('user_id') as string;

  if (!userId && c.req.header('HX-Request')) {
    return c.text('Unauthorized', 302, {
      'HX-Redirect': '/login',
    });
  } else if (!userId) {
    return c.redirect('/login');
  }

  const selectUser = await db.query.user.findFirst({
    with: {
      userGroup: true,
    },
    where: eq(user.id, parseInt(userId)),
  });

  if (!selectUser && c.req.header('hx-request')) {
    return c.text('Unauthorized', 302, {
      'HX-Reswap': 'none',
      'HX-Redirect': '/login',
    });
  } else if (!selectUser) {
    return c.redirect('/app/dashboard');
  }

  if (
    c.req.header('hx-request') &&
    selectUser.userGroup.group_name !== 'bptph'
  ) {
    return c.text('Unauthorized', 302, {
      'HX-Reswap': 'none',
      'HX-Redirect': '/login',
    });
  } else if (selectUser.userGroup.group_name !== 'bptph') {
    return c.redirect('/app/dashboard');
  }

  await next();
});
