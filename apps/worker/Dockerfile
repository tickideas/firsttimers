# Development stage
FROM oven/bun:1.3 AS development
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile

# Production stage
FROM oven/bun:1.3 AS builder
WORKDIR /app
COPY --from=development /app/node_modules ./node_modules
COPY . .
COPY apps/worker/bun.lockb .
COPY apps/worker/src ./src
RUN bun run build

# Runtime stage
FROM oven/bun:1.3 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/dist ./dist
CMD ["bun", "run", "start"]

# Development target
FROM oven/bun:1.3 AS dev
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
