import { createMiddleware } from "hono/factory";

export const authorize = createMiddleware(async (c, next) => {
  await next();
});
