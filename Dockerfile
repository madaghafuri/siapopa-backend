FROM node:20-alpine AS base

FROM base AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*json tsconfig.json tailwind.config.js ./
COPY assets ./assets
COPY drizzle ./drizzle
COPY src ./src
COPY drizzle ./drizzle

RUN npm ci
    # npm run build && \
    # npm run build:css && \
    # npm prune --production

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
# PROD ONLY
# COPY --from=builder --chown=hono:nodejs /app/dist /app/dist
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json
# PROD ONLY
# COPY --from=builder --chown=hono:nodejs /app/assets /app/assets
# DEV ONLY
COPY . .
# PROD ONLY
# RUN npm run build:css

USER root
EXPOSE 3000

# FOR PRODUCTION
# CMD ["node", "/app/dist/index.js"]

CMD npm run build:css && npm run dev