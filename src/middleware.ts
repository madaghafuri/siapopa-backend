import { Session } from "hono-sessions";
import { createMiddleware } from "hono/factory";

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
