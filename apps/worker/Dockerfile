# Development stage
FROM oven/bun:1.3.8 AS development
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/worker/package.json ./apps/worker/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY prisma ./prisma
RUN bun install --frozen-lockfile
RUN bunx prisma generate
COPY . .

# Production stage
FROM oven/bun:1.3.8 AS builder
WORKDIR /app
COPY --from=development /app ./
RUN cd apps/worker && bun run build

# Runtime stage
FROM oven/bun:1.3.8 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.bun ./.bun
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./package.json
CMD ["bun", "run", "dist/index.js"]

# Development target
FROM oven/bun:1.3.8 AS dev
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bunx prisma generate
