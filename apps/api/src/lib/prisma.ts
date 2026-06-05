// File: apps/api/src/lib/prisma.ts
// Description: Prisma client configuration with PostgreSQL adapter and connection pool management
// Why: Provides database access with proper connection pooling and graceful shutdown handling
// RELEVANT FILES: apps/api/src/middleware/tenant-isolation.ts, apps/api/src/app.ts

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

import { env } from '../config/env.js'

const prismaGlobal = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

// Create PostgreSQL connection pool with optimized settings
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout for new connections
})

// Handle pool errors to prevent crashes
pool.on('error', (err: Error) => {
  console.error('Unexpected PostgreSQL pool error:', err)
})

const adapter = new PrismaPg(pool)

export const prisma = prismaGlobal.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
    adapter,
  })

if (env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma
}

// Graceful shutdown helper
export const shutdownPrisma = async (): Promise<void> => {
  await prisma.$disconnect()
  await pool.end()
}
