# Development stage
FROM oven/bun:1.3.0 AS development
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/worker/package.json ./apps/worker/
COPY packages ./packages
RUN bun install --frozen-lockfile
COPY . .

# Production stage
FROM oven/bun:1.3.0 AS builder
WORKDIR /app
COPY --from=development /app ./
RUN cd apps/worker && bun run build

# Runtime stage
FROM oven/bun:1.3.0 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./package.json
CMD ["bun", "run", "dist/index.js"]

# Development target
FROM oven/bun:1.3.0 AS dev
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
