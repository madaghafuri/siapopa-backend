FROM node:20-alpine AS base

FROM base AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*json tsconfig.json src ./

RUN npm ci 
    # npm run build:css
    # npm run build
    # npm prune --production

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
# COPY --from=builder --chown=hono:nodejs /app/dist /app/dist
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json
# DEV ONLY
COPY . .

USER root
EXPOSE 3000

# FOR PRODUCTION
# CMD ["node", "/app/dist/src/index.js"]

CMD npm run build:css && npm run dev