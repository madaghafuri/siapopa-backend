# FROM node:20-alpine AS base

# FROM base AS builder

# RUN apk add --no-cache libc6-compat
# WORKDIR /app

# COPY package*json tsconfig.json tailwind.config.js ./
# COPY assets ./assets
# COPY drizzle ./drizzle
# COPY src ./src
# COPY run.sh ./run.sh

# RUN npm ci   
#   # PROD ONLY
#   # npm run build && \
#   # npm run build:css && \
#   # npm prune --production

# FROM base AS runner
# WORKDIR /app

# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 hono

# COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
# # PROD ONLY
# # COPY --from=builder --chown=hono:nodejs /app/dist /app/dist
# COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json
# # PROD ONLY
# # COPY --from=builder --chown=hono:nodejs /app/assets /app/assets
# # DEV ONLY
# COPY . .

# RUN mkdir -p /data && chown -R hono:nodejs /data

# # PROD ONLY
# # COPY --from=builder /app/drizzle ./drizzle
# # COPY --from=builder /app/run.sh ./run.sh
# # RUN chmod +x run.sh

# USER root
# EXPOSE 3000

# # FOR PRODUCTION
# # CMD ["sh", "run.sh"]

# CMD npm run build:css && npm run dev

FROM oven/bun:1 as base

FROM base as install
WORKDIR /app

RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

FROM base as prerelease
WORKDIR /app
COPY --from=install /temp/dev/node_modules ./node_modules
COPY . .
# PROD
RUN bun run build:css

FROM base as release
WORKDIR /app
COPY --from=install /temp/dev/node_modules ./node_modules
COPY --from=prerelease /app/src ./src
COPY --from=prerelease /app/package.json ./package.json
COPY --from=prerelease /app/dist ./dist
COPY --from=prerelease /app/tsconfig.json ./tsconfig.json
COPY --from=prerelease /app/assets ./assets
COPY --from=prerelease /app/tailwind.config.js ./tailwind.config.js
COPY --from=prerelease /app/postcss.config.js ./postcss.config.js

RUN adduser --system --uid 1001 hono
RUN chown -R hono:bun /app
RUN chmod -R 755 /app

USER hono
EXPOSE 3000/tcp
# DEV
ENTRYPOINT [ "bun", "run", "build:css", "&&", "bun", "--hot", "./src/index.ts" ]

# PROD
# ENTRYPOINT [ "bun", "run", "./src/db/migration.ts", "&&", "bun", "./src/index.ts" ]