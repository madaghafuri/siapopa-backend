import { Hono } from 'hono';
import { Session } from 'hono-sessions';
import LoginPage from './pages/login.js';
import RegisterPage from './pages/register.js';
import { validator } from 'hono/validator';
import { InsertUser, user } from '../db/schema/user.js';
import { db } from '../index.js';
import { and, eq } from 'drizzle-orm';

export const auth = new Hono<{
  Variables: {
    session: Session;
    session_rotation_key: boolean;
  };
}>();

auth.get('/login', async (c) => {
  return c.html(<LoginPage />);
});
auth.post(
  '/login',
  validator('form', (value, c) => {
    const { email, password } = value as Record<
      keyof InsertUser,
      InsertUser[keyof InsertUser]
    >;

    if (!email || !password) {
      return c.html(
        <span class="text-sm text-red-500">
          No records matching credentials
        </span>
      );
    }
    return { email, password };
  }),
  async (c) => {
    const session = c.get('session');
    const { email, password } = c.req.valid('form');

    try {
      var selectUser = await db.query.user.findFirst({
        where: and(eq(user.email, email as string)),
      });
    } catch (error) {
      console.error(error);
    }

    if (!selectUser) {
      return c.html(
        <span class="text-sm text-red-500">
          email atau password yang dimasukkan salah
        </span>
      );
    }

    // const comparePass = bcrypt.compareSync(
    //   password as string,
    //   selectUser.password,
    // );
    const comparePass = await Bun.password.verify(
      password as string,
      selectUser.password
    );

    if (!comparePass) {
      return c.html(
        <span class="text-sm text-red-500">
          email atau password yang dimasukkan salah
        </span>
      );
    }

    session.set('user_id', selectUser.id);
    return c.text('success', 200, {
      'HX-Redirect': '/app/dashboard',
    });
  }
);

auth.post('/logout', async (c) => {
  const session = c.get('session');
  session.deleteSession();
  return c.text('success', 200, {
    'HX-Redirect': '/',
  });
});

auth.get('/register', async (c) => {
  return c.html(<RegisterPage />);
});
auth.post(
  '/register',
  validator('form', (value, c) => {
    const { email, password, name, ...rest } = value as unknown as InsertUser;

    if (!email || !password || !name) {
      return c.html(
        <span class="text-sm text-red-500">
          email atau password belum dimasukkan
        </span>
      );
    }

    return { email, password, name, ...rest };
  }),
  async (c) => {
    const data = c.req.valid('form');
    // const hashedPassword = bcrypt.hashSync(data.password, 10);
    const hashedPassword = await Bun.password.hash(data.password, {
      algorithm: 'bcrypt',
      cost: 10,
    });

    const insertedUser = await db
      .insert(user)
      .values({ ...data, password: hashedPassword })
      .returning();

    if (insertedUser.length === 0) {
      return c.html(
        <span class="text-sm text-red-500">
          terjadi kesalahan pada sistem, silahkan coba lagi
        </span>,
        500
      );
    }

    return c.text('success', 200, { 'HX-Redirect': '/login' });
  }
);
