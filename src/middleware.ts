import { Session } from "hono-sessions";
import { createMiddleware } from "hono/factory";
import { lucia } from "./index.js";

export const authorize = createMiddleware<{
  Variables: { session: Session; session_rotation_key: boolean };
}>(async (c, next) => {
  const session = c.get("session");
  const userId = session.get("user_id") as string;

  if (!userId) {
    return c.redirect("/login");
  }
  await next();
});

export const authorizeApi = createMiddleware(async (c, next) => {
  const authorizationHeader = c.req.header("Authorization");

  const token = lucia.readBearerToken(authorizationHeader ?? "");
  if (!token)
    return c.json(
      {
        status: 401,
        message: "Bearer token missing from request header",
      },
      401,
    );
  const { session, user } = await lucia.validateSession(token);

  if (!session || !user) {
    return c.json(
      {
        status: 401,
        message: "Bearer token is invalid",
      },
      401,
    );
  }

  await next();
});
