# Development stage
FROM oven/bun:1.3 AS development
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages
COPY prisma ./prisma
RUN bun install --frozen-lockfile
COPY . .

# Production stage
FROM oven/bun:1.3 AS builder
WORKDIR /app
COPY --from=development /app ./
RUN cd apps/api && bun run build

# Runtime stage
FROM oven/bun:1.3 AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1
CMD ["bun", "run", "dist/index.js"]

# Development target
FROM oven/bun:1.3 AS dev
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
