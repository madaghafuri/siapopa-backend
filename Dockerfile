FROM oven/bun:1 AS base

FROM base AS install
WORKDIR /app

RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

FROM base AS prerelease
WORKDIR /app
COPY --from=install /temp/dev/node_modules ./node_modules
COPY --from=install /temp/dev/package.json ./package.json
COPY src ./src

# PROD
RUN bun run build:css:prod

FROM base AS release
WORKDIR /app
COPY --from=install /temp/dev/node_modules ./node_modules
COPY --from=install /temp/dev/package.json ./package.json
COPY fonts ./fonts
COPY src ./src
COPY --from=prerelease /app/dist ./dist
COPY tsconfig.json ./tsconfig.json
COPY assets ./assets
COPY tailwind.config.js ./tailwind.config.js
COPY postcss.config.js ./postcss.config.js
COPY drizzle ./drizzle
COPY drizzle.config.ts ./drizzle.config.ts
COPY run.sh ./run.sh

RUN adduser --system --uid 1001 hono
RUN mkdir -p /app/uploads
RUN chown -R hono:bun /app/uploads
RUN chown -R hono:bun /app
RUN chmod -R 775 /app/uploads

USER hono

EXPOSE 3000/tcp

# PROD
ENTRYPOINT ["sh", "run.sh"]