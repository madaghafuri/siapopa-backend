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

RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

RUN adduser --system --uid 1001 hono
RUN mkdir -p /app/uploads
RUN chown -R hono:bun /app/uploads
RUN chown -R hono:bun /app
RUN chmod -R 775 /app/uploads

USER hono

RUN bunx puppeteer browsers install

EXPOSE 3000/tcp

# PROD
ENTRYPOINT ["sh", "run.sh"]