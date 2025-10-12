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
COPY apps/web ./
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN bun run build

# Runtime stage
FROM oven/bun:1.3 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
CMD ["bun", "run", "start"]

# Development target
FROM oven/bun:1.3 AS dev
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
