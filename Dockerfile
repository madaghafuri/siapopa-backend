FROM node:20-alpine AS base

FROM base AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*json tsconfig.json tailwind.config.js ./
COPY assets ./assets
COPY drizzle ./drizzle
COPY src ./src
COPY run.sh ./run.sh

RUN npm ci
    # PROD ONLY
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

RUN mkdir -p /data && chown -R hono:nodejs /data

# PROD ONLY
# COPY --from=builder /app/drizzle ./drizzle
# COPY --from=builder /app/run.sh ./run.sh
# RUN chmod +x run.sh

USER root
EXPOSE 3000

# FOR PRODUCTION
# CMD ["sh", "run.sh"]

CMD npm run build:css && npm run dev