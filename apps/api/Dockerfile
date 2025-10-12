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
COPY apps/api/src ./src
RUN bun run build

# Runtime stage
FROM oven/bun:1.3 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages ./packages
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1
CMD ["bun", "run", "start"]

# Development target
FROM oven/bun:1.3 AS dev
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
