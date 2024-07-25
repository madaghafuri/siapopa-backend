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
COPY . .
# PROD
RUN bun run build:css:prod

FROM base AS release
WORKDIR /app
COPY --from=install /temp/dev/node_modules ./node_modules
COPY --from=prerelease /app/src ./src
COPY --from=prerelease /app/package.json ./package.json
COPY --from=prerelease /app/dist ./dist
COPY --from=prerelease /app/tsconfig.json ./tsconfig.json
COPY --from=prerelease /app/assets ./assets
COPY --from=prerelease /app/tailwind.config.js ./tailwind.config.js
COPY --from=prerelease /app/postcss.config.js ./postcss.config.js
COPY --from=prerelease /app/drizzle ./drizzle
COPY --from=prerelease /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=prerelease /app/run.sh ./run.sh

RUN adduser --system --uid 1001 hono
RUN mkdir -p /app/uploads
RUN chown -R hono:bun /app/uploads
RUN chmod -R 775 /app/uploads

USER hono
EXPOSE 3000/tcp

# PROD
ENTRYPOINT ["sh", "run.sh"]